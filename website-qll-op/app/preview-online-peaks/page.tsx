import { notFound } from "next/navigation";
import TrafficCharts from "../TrafficCharts";
import { buildOnlinePeakPoints } from "../trafficMetrics";

export default function PreviewOnlinePeaks() {
  if (process.env.NODE_ENV !== "development") notFound();

  const end = Date.parse("2026-11-23T10:27:00+07:00");
  const peaks = [10, 11, 10, 12, 12, 14, 13, 11, 10, 12, 14, 15, 14, 13, 13, 11, 8, 9, 12, 10, 14, 14, 16, 18, 17, 18, 15, 16, 19, 20, 18, 20, 19, 17, 20, 21, 15, 15, null, 0];
  const points = buildOnlinePeakPoints(peaks.map((peak_online, index) => ({
    bucket_end: new Date(end - (peaks.length - 1 - index) * 180_000).toISOString(),
    peak_online,
  })), end);

  return (
    <main className="min-h-screen bg-[#0e1320] p-4 text-white sm:p-6">
      <h1 className="mb-1 text-lg font-bold">Xem thử biểu đồ online</h1>
      <p className="mb-4 text-sm text-slate-400">Dữ liệu mẫu: tăng, giảm, đi ngang, thiếu mẫu và về 0.</p>
      <TrafficCharts todayChartData={points} historicalChartData={[]} theme="dark" />
    </main>
  );
}
