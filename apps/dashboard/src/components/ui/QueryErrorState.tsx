import { Button } from "@nextui-org/react";

interface QueryErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function QueryErrorState({
  error,
  onRetry,
  compact = false,
}: QueryErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20">
        <span className="material-symbols-outlined text-danger text-[24px]">
          cloud_off
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-body-md font-body-md text-on-background truncate">
            Gagal memuat data
          </p>
          <p className="text-body-sm font-body-sm text-on-surface-variant truncate">
            {error?.message || "Terjadi kesalahan jaringan"}
          </p>
        </div>
        {onRetry && (
          <Button
            size="sm"
            color="danger"
            variant="flat"
            onPress={onRetry}
            startContent={
              <span className="material-symbols-outlined text-[16px]">
                refresh
              </span>
            }
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-5">
        <span
          className="material-symbols-outlined text-danger text-[40px]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
        >
          cloud_off
        </span>
      </div>
      <h3 className="text-title-lg font-title-lg text-on-background mb-1">
        Gagal memuat data
      </h3>
      <p className="text-body-md font-body-md text-on-surface-variant max-w-sm mb-1">
        Pastikan koneksi internet Anda stabil dan server berjalan.
      </p>
      <p className="text-body-sm font-body-sm text-on-surface-variant/60 max-w-sm mb-5 font-mono">
        {error?.message || "Network error"}
      </p>
      {onRetry && (
        <Button
          color="primary"
          variant="flat"
          onPress={onRetry}
          startContent={
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
          }
        >
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
