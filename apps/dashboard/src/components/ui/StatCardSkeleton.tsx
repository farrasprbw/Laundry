import { Skeleton } from "@nextui-org/react";

interface StatCardSkeletonProps {
  count?: number;
}

export function StatCardSkeleton({ count = 5 }: StatCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="rounded-lg w-24 h-4" />
            <Skeleton className="rounded-full w-8 h-8" />
          </div>
          <div>
            <Skeleton className="rounded-lg w-32 h-8 mb-2" />
            <Skeleton className="rounded-lg w-20 h-3" />
          </div>
        </div>
      ))}
    </>
  );
}
