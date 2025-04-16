import Carousel from './components/Carousel';
import MessageBoard from './components/MessageBoard';
import Roster from './components/Roster';
import ScanNotify from './components/ScanNotify';
import HoursGrid from './components/HoursGrid';
import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import BarcodeScanner from './lib/barcode';
import "./App.css";

function App() {
  const [workers, setWorkers] = useState([]);
  const [timeclockHours, setTimeclockHours] = useState([]);
  const [latestScan, setLatestScan] = useState(null);
  const [scanNotify, setScanNotify] = useState(false);
  const timerRef = useRef(null);
  const doScanRef = useRef(null);

  const registerDoScan = (doScanFunction) => {
    doScanRef.current = doScanFunction;
  };

  useEffect(() => {
    invoke('fetch_workers').then((res) => {
      const sortedWorkers = res.records
        .map(({ fields }) => ({ ...fields }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setWorkers(sortedWorkers);
    });
    invoke('fetch_hours').then((res) => {
      setTimeclockHours(res.records.map(({ fields }) => ({ ...fields })));
    });
  }, []);

  const showScanNotify = (person) => {
    setLatestScan(person);
    setScanNotify(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setScanNotify(false);
      timerRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    // required to prevent tauri from going 'idle' and taking excessively long for a new scan.
    const heartbeatInterval = setInterval(() => { }, 15000);
  }, []);

  useEffect(() => {
    const scanner = new BarcodeScanner({
      timeout: 50,
      shouldCapture: () => true,
      barcodeCallback: (scannedValue) => {
        console.log("Scanned barcode:", scannedValue);
        const matchedWorker = workers.find(worker => worker.mdoc == scannedValue);
        if (matchedWorker) {
          if (doScanRef.current) {
            doScanRef.current(matchedWorker);
          } else {
            console.warn("doScan not registered yet");
          }
        } else {
          console.warn("No worker matches the scanned barcode:", scannedValue);
        }
      },
    });

    return () => {
      scanner.destroy();
    };
  }, [workers]);

  return (
    <div className="grid grid-cols-2 grid-rows-2 h-screen w-screen">
      {/* Top Left */}
      <div className="border-b-3 border-r-3 border-gray-500 bg-black flex">
        <Carousel />
      </div>

      {/* Top Right */}
      <div className="border-b-3 border-l-3 border-gray-500 flex items-center justify-center">
        <MessageBoard />
      </div>

      {/* Bottom Left */}
      <div className="border-t-3 border-r-3 border-gray-500 bg-slate-200 flex items-center justify-center">
        <Roster
          registerDoScan={registerDoScan}
          showScanNotify={showScanNotify}
          workers={workers}
          timeclockHours={timeclockHours}
          setTimeclockHours={setTimeclockHours}
        />
      </div>

      {/* Bottom Right */}
      <div className="border-t-3 border-l-3 border-gray-500 flex items-center justify-center">
        {scanNotify ? (
          <ScanNotify
            latestScanData={latestScan}
            workers={workers}
            timeclockHours={timeclockHours}
          />
        ) : (
          <HoursGrid
            workers={workers}
            timeclockHours={timeclockHours}
          />
        )}
      </div>
    </div>
  );
}

export default App;
