import { Skeleton } from "@nextui-org/react";

interface ChartSkeletonProps {
  height?: string;
}

export function ChartSkeleton({ height = "h-[300px]" }: ChartSkeletonProps) {
  return (
    <div className={`w-full ${height} flex flex-col justify-end gap-2 p-4`}>
      {/* Fake Y-axis labels */}
      <div className="flex items-end gap-3 flex-1">
        <div className="flex flex-col justify-between h-full py-2 w-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`y-${i}`} className="rounded w-10 h-3" />
          ))}
        </div>
        {/* Fake bars */}
        <div className="flex items-end gap-2 flex-1 h-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={`bar-${i}`}
              className="rounded-t-md flex-1"
              style={{
                height: `${25 + Math.random() * 60}%`,
              }}
            />
          ))}
        </div>
      </div>
      {/* Fake X-axis labels */}
      <div className="flex gap-2 ml-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={`x-${i}`} className="rounded flex-1 h-3" />
        ))}
      </div>
    </div>
  );
}
