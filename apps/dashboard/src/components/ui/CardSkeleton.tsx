import { Skeleton } from "@nextui-org/react";

interface CardSkeletonProps {
  count?: number;
  /** 'horizontal' for list-style cards, 'vertical' for grid cards */
  layout?: "horizontal" | "vertical";
}

export function CardSkeleton({
  count = 4,
  layout = "vertical",
}: CardSkeletonProps) {
  if (layout === "horizontal") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 flex items-center gap-4"
          >
            <Skeleton className="rounded-full w-10 h-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="rounded-lg w-3/4 h-4" />
              <Skeleton className="rounded-lg w-1/2 h-3" />
            </div>
            <Skeleton className="rounded-lg w-16 h-8" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="rounded-full w-10 h-10 shrink-0" />
            <Skeleton className="rounded-lg flex-1 h-5" />
          </div>
          <Skeleton className="rounded-lg w-full h-4" />
          <Skeleton className="rounded-lg w-2/3 h-4" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="rounded-lg w-16 h-7" />
            <Skeleton className="rounded-lg w-16 h-7" />
          </div>
        </div>
      ))}
    </div>
  );
}
