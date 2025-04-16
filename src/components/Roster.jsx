import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { printers } from 'tauri-plugin-printer';
import { invoke } from '@tauri-apps/api/tauri';

export default function Roster({
  showScanNotify,
  workers,
  timeclockHours,
  setTimeclockHours,
  registerDoScan
}) {
  const [time, setTime] = useState(format(new Date(), 'HH:mm:ss'));
  const timerRef = useRef(null);
  const lastClickedRef = useRef(null);

  const getWorkerStatus = useCallback(
    (person) => {
      let location = 0;
      let outcount = 0;

      const matchedEntries = timeclockHours
        .filter((item) => item.mdoc === person.mdoc)
        .sort((a, b) => new Date(b.scan_datetime) - new Date(a.scan_datetime));

      if (matchedEntries.length === 0) {
        return { location, outcount };
      }

      const newestEntry = matchedEntries[0];
      if (newestEntry.status === 'In') {
        location = person.offsite ? 2 : 1;
        if (person.outcount) {
          outcount = 1;
        }
      }
      if (newestEntry.status === 'Out') {
        if (person.outcount) {
          outcount = 2;
        }
      }
      return { location, outcount };
    },
    [timeclockHours]
  );

  const workerStatuses = useMemo(() => {
    return workers.reduce((acc, person) => {
      acc[person.mdoc] = getWorkerStatus(person);
      return acc;
    }, {});
  }, [workers, getWorkerStatus]);

  useEffect(() => {
    printers().then((list) => {
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const formatTime = (time) => (time.startsWith('0') ? time.substring(1) : time);
      setTime(formatTime(format(new Date(), 'HH:mm:ss')));
    }, 1000);
    return () => clearInterval(interval);
  }, [time]);

  const columnCount = workers.length > 100 ? 6 : workers.length >= 80 ? 5 : 4;
  const rowsPerColumn = 20;
  const columns = Array.from({ length: columnCount }, (_, colIndex) => {
    const startIndex = colIndex * rowsPerColumn;
    const endIndex = startIndex + rowsPerColumn;
    return workers.slice(startIndex, endIndex);
  });

  const locationStyles = {
    0: 'bg-red-500 text-white',
    1: 'bg-green-500 text-white',
    2: 'bg-orange-500 text-blue-800',
  };

  const circleStyles = {
    0: 'bg-gray-300',
    1: 'bg-blue-800',
    2: 'bg-yellow-500',
  };

  const updateTimeclockHours = (person) => {
    const personEntries = timeclockHours
      .filter((entry) => entry.mdoc === person.mdoc)
      .sort((a, b) => b.scan_datetime - a.scan_datetime);

    let newEntry = {
      changed_by: 'timeclock',
      manualSort: timeclockHours.length + 1,
      mdoc: person.mdoc,
      scan_type: 'Scan',
      scan_datetime: Math.floor(Date.now() / 1000),
      updated_time: '',
    };

    if (personEntries.length === 0 || personEntries[0].status === 'Out') {
      newEntry = { ...newEntry, status: 'In' };
    } else if (personEntries[0].status === 'In') {
      newEntry = { ...newEntry, status: 'Out' };
    }
    invoke('add_scan_record', { newEntry })
      .then((res) => {
        setTimeclockHours((prev) => [...prev, newEntry]);
      })
      .catch((err) => console.error('Error adding scan record:', err));
  };

  const doScan = (person) => {
    console.log(`Double-click detected: Performing scan for ${person.name}`);
    updateTimeclockHours(person);
    showScanNotify(person);
  };

  const doQuery = (person) => {
    console.log(`Single-click detected: Querying ${person.name}`);
  };

  const handleClick = (person) => {
    if (timerRef.current && lastClickedRef.current === person.name) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      lastClickedRef.current = null;
      doScan(person);
    } else {
      lastClickedRef.current = person.name;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        doQuery(person);
        timerRef.current = null;
        lastClickedRef.current = null;
      }, 600);
    }
  };

  useEffect(() => {
    if (registerDoScan) {
      registerDoScan(doScan);
    }
  }, [doScan, registerDoScan]);

  const printWorkers = () => {
    const printableContent = workers
      .filter(w => (workerStatuses[w.mdoc] || {}).location === 1)
      .map(w => w.name)
      .join('\n');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>On-Site Employees</title>
          </head>
          <body>
            <h1>On-Site Employees</h1>
            <pre>${printableContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="block print:hidden">
      <div className="h-full w-full flex flex-col justify-center items-center">
        <div
          className="grid h-[43vh] w-full"
          style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
        >
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col">
              {column.map((person, rowIndex) => {
                const { location, outcount } = workerStatuses[person.mdoc] || {};
                return (
                  <div
                    key={rowIndex}
                    className={`select-none flex items-center cursor-pointer border-style-line border-r border-b border-gray-800 h-[2.1vh] ${locationStyles[location]}`}
                    onClick={() => handleClick(person)}
                  >
                    <div
                      className={`w-4 h-4 ml-2 mr-2 rounded-full ${circleStyles[outcount]}`}
                    ></div>
                    <span className="text-xs">{person.name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="h-[7vh] w-full">
          <div className="h-[2.5vh] w-full flex justify-between">
            <div className="flex">
              <p className="bg-green-500 text-white text-sm px-1 mx-1 ml-4 border border-gray-800">
                Working
              </p>
              <p className="bg-red-500 text-white text-sm px-1 mx-1 border border-gray-800">
                Not Working
              </p>
              <p className="bg-orange-500 text-blue-800 text-sm px-1 mx-1 border border-gray-800">
                Check Offsite
              </p>
            </div>
            <div className="flex">
              <button
                onClick={printWorkers}
                className="h-6 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 border border-gray-800 mr-8"
              >
                Print
              </button>
            </div>
          </div>
          <div className="mt-4 w-full flex justify-between">
            <p className="text-xl font-bold ml-4">
              Worker Count:{' '}
              {workers.filter(
                (person) => (workerStatuses[person.mdoc] || {}).location === 1
              ).length}
            </p>
            <p className="text-xl font-bold mr-8">{time}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
