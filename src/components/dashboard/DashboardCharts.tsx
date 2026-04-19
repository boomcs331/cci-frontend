"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DonutChartProps {
  labels: string[];
  series: number[];
  height?: number;
}

const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316"];

export function StatusDonutChart({ labels, series, height = 260 }: DonutChartProps) {
  if (series.length === 0 || series.every((n) => n === 0)) {
    return <p className="text-xs text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</p>;
  }
  const options: ApexOptions = {
    chart: { type: "donut", foreColor: "#9CA3AF", toolbar: { show: false } },
    labels,
    colors: PALETTE.slice(0, Math.max(labels.length, 3)),
    legend: { position: "bottom", fontSize: "12px" },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            value: { fontSize: "20px", fontWeight: 600 },
            total: { show: true, label: "รวม" },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => String(v) } },
  };
  return <ReactApexChart options={options} series={series} type="donut" height={height} />;
}

interface BarChartProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  height?: number;
  horizontal?: boolean;
}

export function TopBarChart({ categories, series, height = 280, horizontal = true }: BarChartProps) {
  if (categories.length === 0) {
    return <p className="text-xs text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</p>;
  }
  const options: ApexOptions = {
    chart: { type: "bar", foreColor: "#9CA3AF", toolbar: { show: false } },
    colors: ["#3B82F6"],
    plotOptions: {
      bar: { horizontal, borderRadius: 4, columnWidth: "70%", barHeight: "70%" },
    },
    dataLabels: { enabled: true, style: { fontSize: "11px" } },
    xaxis: { categories, labels: { style: { fontSize: "11px" } } },
    yaxis: { labels: { style: { fontSize: "11px" } } },
    grid: { borderColor: "#E5E7EB33" },
  };
  return <ReactApexChart options={options} series={series} type="bar" height={height} />;
}

interface TrendLineChartProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  height?: number;
}

export function TrendLineChart({ categories, series, height = 260 }: TrendLineChartProps) {
  if (categories.length === 0) {
    return <p className="text-xs text-gray-500 dark:text-gray-400">ไม่มีข้อมูล</p>;
  }
  const options: ApexOptions = {
    chart: {
      type: "area",
      foreColor: "#9CA3AF",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: PALETTE,
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0 } },
    xaxis: { categories, labels: { style: { fontSize: "11px" } } },
    yaxis: { labels: { style: { fontSize: "11px" } } },
    legend: { position: "top", fontSize: "12px" },
    grid: { borderColor: "#E5E7EB33" },
  };
  return <ReactApexChart options={options} series={series} type="area" height={height} />;
}
