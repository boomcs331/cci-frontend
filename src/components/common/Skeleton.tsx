import React from "react";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

const ROUND_MAP: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${ROUND_MAP[rounded]} ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
          rounded="md"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" rounded="md" />
        <Skeleton className="h-6 w-6" rounded="full" />
      </div>
      <Skeleton className="mt-4 h-8 w-32" rounded="md" />
      <Skeleton className="mt-2 h-3 w-40" rounded="md" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5, className = "" }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="grid gap-3 border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`th-${i}`} className="h-3 w-24" rounded="md" />
        ))}
      </div>
      <div className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="grid gap-3 p-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={`td-${r}-${c}`} className="h-3 w-full" rounded="md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
