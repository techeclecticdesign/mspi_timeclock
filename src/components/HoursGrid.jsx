import React, { useState, useEffect } from "react";

export default function HoursGrid({ workers, timeclockHours }) {
  const splitInterval = (start, end) => {
    let current = new Date(start);
    const result = {};
    while (current < end) {
      const dayKey = current.toISOString().split("T")[0];
      if (!result[dayKey]) {
        result[dayKey] = { AM: 0, PM: 0 };
      }
      const currentDay = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate()
      );
      const periodBoundary = new Date(currentDay);
      periodBoundary.setHours(10, 30, 0, 0);
      const nextDay = new Date(currentDay);
      nextDay.setDate(currentDay.getDate() + 1);
      let nextBoundary;
      if (current < periodBoundary) {
        nextBoundary = end < periodBoundary ? end : periodBoundary;
        result[dayKey].AM += (nextBoundary - current) / (1000 * 3600);
      } else {
        nextBoundary = end < nextDay ? end : nextDay;
        result[dayKey].PM += (nextBoundary - current) / (1000 * 3600);
      }
      current = nextBoundary;
    }
    return result;
  };

  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const daysSinceThursday =
    currentDayOfWeek >= 4 ? currentDayOfWeek - 4 : currentDayOfWeek + 3;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceThursday);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  }).filter((d) => d.getDay() !== 6);

  const workerHours = {};
  workers.forEach((worker) => {
    workerHours[worker.mdoc] = {};
    weekDays.forEach((day) => {
      const dateStr = day.toISOString().split("T")[0];
      workerHours[worker.mdoc][dateStr] = { AM: 0, PM: 0 };
    });
  });

  const recordsByWorker = {};
  timeclockHours.forEach((record) => {
    const mdoc = record.mdoc;
    if (!recordsByWorker[mdoc]) {
      recordsByWorker[mdoc] = [];
    }
    recordsByWorker[mdoc].push(record);
  });

  Object.keys(recordsByWorker).forEach((mdoc) => {
    recordsByWorker[mdoc].sort((a, b) => a.scan_datetime - b.scan_datetime);
  });

  Object.entries(recordsByWorker).forEach(([mdoc, records]) => {
    let inTime = null;
    records.forEach((record) => {
      const status = record.status.toLowerCase();
      const ts = record.scan_datetime * 1000;
      const dt = new Date(ts);
      if (status === "in") {
        inTime = dt;
      } else if (status === "out" && inTime) {
        const outTime = dt;
        const intervalParts = splitInterval(inTime, outTime);
        Object.entries(intervalParts).forEach(([dateStr, periodData]) => {
          if (workerHours[mdoc] && workerHours[mdoc][dateStr]) {
            workerHours[mdoc][dateStr].AM += periodData.AM;
            workerHours[mdoc][dateStr].PM += periodData.PM;
          }
        });
        inTime = null;
      }
    });
  });

  const pageSize = 17;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(workers.length / pageSize);
  const paginatedWorkers = workers.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPage((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
    }, 15000);
    return () => clearInterval(intervalId);
  }, [totalPages]);

  return (
    <div>
      <table className="w-full border-collapse border text-md">
        <thead>
          <tr>
            <th rowSpan="2" className="border text-center">
              Worker
            </th>
            {weekDays.map((day) => (
              <th
                key={day.toISOString()}
                colSpan="2"
                className="text-sm border text-center w-[10%]"
              >
                {day.toLocaleDateString(undefined, { weekday: "long" })}
              </th>
            ))}
          </tr>
          <tr>
            {weekDays.map((day) => (
              <React.Fragment key={day.toISOString()}>
                <th className="border text-center">AM</th>
                <th className="border text-center">PM</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedWorkers.map((worker, idx) => {
            const mdoc = worker.mdoc;
            const rowClass = idx % 2 === 0 ? "bg-white" : "bg-gray-100";
            return (
              <tr key={mdoc} className={rowClass}>
                <td className="border text-center">{worker.name}</td>
                {weekDays.map((day) => {
                  const dateStr = day.toISOString().split("T")[0];
                  const dayData =
                    workerHours[mdoc] && workerHours[mdoc][dateStr]
                      ? workerHours[mdoc][dateStr]
                      : { AM: 0, PM: 0 };
                  return (
                    <React.Fragment key={dateStr}>
                      <td className="border text-center">
                        {dayData.AM.toFixed(1)}
                      </td>
                      <td className="border text-center">
                        {dayData.PM.toFixed(1)}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
