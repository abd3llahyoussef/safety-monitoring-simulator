import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartDataset,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { TimeSeriesPoint } from "../types/machine";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export interface LiveLineChartProps {
  title: string;
  points: TimeSeriesPoint[];
  unit: string;
  color: string;
  yMin?: number;
  yMax?: number;
  /** Draws a dashed amber reference line at this value (e.g. an alarm threshold). */
  warningValue?: number;
  /** Draws a dashed red reference line at this value. */
  criticalValue?: number;
  /** Renders as a square/step wave instead of a smooth curve - use for digital 0/1 sensors. */
  stepped?: boolean;
  /** Custom formatter for the "latest value" readout in the card header, e.g. "TRIGGERED" instead of "1". */
  formatLatest?: (value: number) => string;
  /** Custom formatter for tooltip/axis labels, e.g. mapping 0/1 -> "Clear"/"Detected". */
  formatValue?: (value: number) => string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * A single, self-contained line chart. Render one per sensor stream and
 * feed it its own slice of time-series data - fully independent of the
 * others, so it can be dropped into any layout.
 */
export default function LiveLineChart({
  title,
  points,
  unit,
  color,
  yMin,
  yMax,
  warningValue,
  criticalValue,
  stepped = false,
  formatLatest,
  formatValue,
}: LiveLineChartProps) {
  const chartData = useMemo(() => {
    const labels = points.map((p) => formatTime(p.timestamp));
    const datasets: ChartDataset<"line", number[]>[] = [
      {
        label: unit ? `${title} (${unit})` : title,
        data: points.map((p) => p.value),
        borderColor: color,
        backgroundColor: `${color}33`,
        pointBackgroundColor: color,
        pointRadius: stepped ? 0 : 2.5,
        tension: stepped ? 0 : 0.35,
        stepped: stepped ? "before" : false,
        fill: true,
        order: 1,
      },
    ];

    if (warningValue !== undefined) {
      datasets.push({
        label: "Warning limit",
        data: points.map(() => warningValue),
        borderColor: "#f59e0b",
        backgroundColor: "transparent",
        pointRadius: 0,
        borderDash: [6, 4],
        tension: 0,
        fill: false,
        order: 0,
      });
    }

    if (criticalValue !== undefined) {
      datasets.push({
        label: "Critical limit",
        data: points.map(() => criticalValue),
        borderColor: "#ef4444",
        backgroundColor: "transparent",
        pointRadius: 0,
        borderDash: [3, 3],
        tension: 0,
        fill: false,
        order: 0,
      });
    }

    return { labels, datasets };
  }, [points, title, unit, color, warningValue, criticalValue]);

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      scales: {
        x: {
          ticks: { color: "#9ca3af", maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
        y: {
          min: yMin,
          max: yMax,
          ticks: {
            color: "#9ca3af",
            stepSize: stepped ? 1 : undefined,
            callback: (value) => (formatValue ? formatValue(Number(value)) : value),
          },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
      },
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const raw = ctx.parsed.y ?? 0;
              const formatted = formatValue ? formatValue(raw) : `${raw} ${unit}`;
              return `${ctx.dataset.label ?? ""}: ${formatted}`;
            },
          },
        },
      },
    }),
    [unit, yMin, yMax, stepped, formatValue]
  );

  const latest = points.length > 0 ? points[points.length - 1].value : null;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <h3>{title}</h3>
        <span className="chart-card__latest" style={{ color }}>
          {latest === null ? "—" : formatLatest ? formatLatest(latest) : `${latest} ${unit}`}
        </span>
      </div>
      <div className="chart-card__canvas">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
