"use client";
import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { useCountUp } from "@/hooks/useCountUp";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export interface ApplicationStatus {
  total: number;
  new: number;
  processing: number;
  approved: number;
  declined: number;
}

export function ApplicationStatusChart({ data }: { data: ApplicationStatus }) {
  const [mounted, setMounted] = useState(false);
  const total = useCountUp(data.total, 1000);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const chartData = {
    labels: ["New", "Processing", "Approved", "Declined"],
    datasets: [
      {
        data: [data.new, data.processing, data.approved, data.declined],
        backgroundColor: [
          "rgb(59, 130, 246)", // blue-500 (New)
          "rgb(168, 85, 247)", // purple-500 (Processing)
          "rgb(16, 185, 129)", // emerald-500 (Approved - includes Pre-Approved)
          "rgb(248, 113, 113)", // red-400 (Declined)
        ],
        borderColor: "rgb(255, 255, 255)",
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "70%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgb(31, 41, 55)",
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(229, 231, 235)",
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce(
              (a, b) => (a as number) + (b as number),
              0,
            ) as number;
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: "easeInOutQuart",
    },
  };

  return (
    <div className="card-hover rounded-xl border border-gray-100 bg-white p-5 flex flex-col items-center animate-scaleIn stagger-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Application Status
      </h3>

      <div className="relative w-[140px] h-[140px] mb-4">
        {mounted && <Doughnut data={chartData} options={options} />}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-900 leading-none">
            {total}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">Applications</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-gray-500">New</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-gray-500">Processing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-gray-500">Approved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-gray-500">Declined</span>
        </div>
      </div>
    </div>
  );
}
