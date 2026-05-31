import { Skeleton } from "@nextui-org/react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-3 pt-2">
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex gap-3 px-4 py-3 border-t border-outline-variant/10"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              className="rounded-lg flex-1 h-4"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
