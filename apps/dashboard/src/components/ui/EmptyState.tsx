import { Button } from "@nextui-org/react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-5">
        <span
          className="material-symbols-outlined text-on-surface-variant text-[40px]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
        >
          {icon}
        </span>
      </div>
      <h3 className="text-title-lg font-title-lg text-on-background mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-body-md font-body-md text-on-surface-variant max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          color="primary"
          variant="flat"
          onPress={onAction}
          className="mt-5"
          startContent={
            <span className="material-symbols-outlined text-[18px]">add</span>
          }
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
