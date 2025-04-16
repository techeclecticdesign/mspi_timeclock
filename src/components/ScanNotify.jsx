import React, { useMemo } from 'react';

export default function ScanNotify({ latestScanData, timeclockHours }) {
  if (!latestScanData) {
    return <div>No Scan Data</div>;
  }

  const person = latestScanData;
  const name = person.name;
  const mdoc = person.mdoc;
  const currentMonthsHours = person.curr_month_hours;
  const previousWeeksHours = person.prev_week_hours;
  const imgSource = 'mickeymouse.jpg';

  const status = useMemo(() => {
    const recordsForMdoc = timeclockHours.filter(
      (record) => record.mdoc === mdoc
    );
    if (recordsForMdoc.length === 0) {
      return 'Unknown';
    }
    const latestRecord = recordsForMdoc.reduce((prev, curr) => {
      return curr.scan_datetime > prev.scan_datetime ? curr : prev;
    });
    return latestRecord.status;
  }, [timeclockHours, mdoc]);

  const computeCurrentWeekHours = (mdoc) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysSinceThursday = (dayOfWeek + 3) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysSinceThursday);
    startOfWeek.setHours(0, 0, 0, 0);

    const filteredRecords = timeclockHours.filter(
      (record) =>
        record.mdoc === mdoc &&
        record.scan_datetime * 1000 >= startOfWeek.getTime()
    );

    let totalSeconds = 0;
    let inTime = null;

    filteredRecords.forEach((record) => {
      const recordStatus = record.status.toLowerCase();
      const recordDate = new Date(record.scan_datetime * 1000);

      if (recordStatus === 'in') {
        inTime = recordDate;
      } else if (recordStatus === 'out' && inTime) {
        totalSeconds += Math.max(0, (recordDate - inTime) / 1000);
        inTime = null;
      }
    });
    return (totalSeconds / 3600).toFixed(1);
  };

  const currentWeeksHours = useMemo(
    () => computeCurrentWeekHours(mdoc),
    [timeclockHours, mdoc]
  );

  return (
    <div className="flex w-full h-full flex-col md:flex-row items-start md:items-center p-4 bg-gray-100 shadow-md">
      <div className="mx-auto flex flex-row">
        <div className="flex flex-col items-center md:items-start">
          <img
            src={imgSource}
            alt={name}
            className="w-80 h-80 rounded-full border border-gray-300"
          />
          <div className="mt-2 text-gray-600 text-xl mx-auto text-center">
            <div>{name}</div>
            <div>MDOC#: {mdoc}</div>
          </div>
        </div>
        <div className="ml-0 md:ml-8 mt-4 md:mt-0">
          <h2 className="text-5xl font-bold text-gray-700">
            Signed {status}: 11:45:23
          </h2>
          <hr className="my-6 mb-10 border-t border-gray-300" />
          <div className="text-gray-700 text-3xl leading-[3rem]">
            <p>Hours Worked Current Month: {currentMonthsHours}</p>
            <p>Hours Worked Current Week (Th-We): {currentWeeksHours}</p>
            <p>Hours Worked Previous Week (Th-We): {previousWeeksHours}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
