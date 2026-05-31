import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Avatar,
  Alert,
  Chip,
  Skeleton,
} from "@nextui-org/react";
import { TableSkeleton } from "../components/ui/TableSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import {
  useReceivableSummary,
  useReceivableAging,
  useReceivablesByCustomer,
  useSendReminder,
} from "../hooks/use-receivables";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function Receivables() {
  const { data: summary, isLoading: loadingSummary } = useReceivableSummary();
  const { data: aging, isLoading: loadingAging } = useReceivableAging();
  const { data: customers, isLoading: loadingCustomers } =
    useReceivablesByCustomer();
  const sendReminder = useSendReminder();

  const [alertState, setAlertState] = useState<{
    message: string;
    color: "success" | "danger" | "warning";
  } | null>(null);

  const handleSendReminder = (customerId: string, customerName: string) => {
    sendReminder.mutate(customerId, {
      onSuccess: () => {
        setAlertState({
          message: `Reminder terkirim ke ${customerName}`,
          color: "success",
        });
        setTimeout(() => setAlertState(null), 3000);
      },
      onError: (err: Error) => {
        setAlertState({
          message: `Gagal kirim reminder: ${err.message || "Unknown error"}`,
          color: "danger",
        });
        setTimeout(() => setAlertState(null), 3000);
      },
    });
  };

  return (
    <div className="pt-24 pb-24 md:pt-24 md:pb-12 px-container-padding-mobile md:px-container-padding-desktop w-full flex-1">
      {alertState && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-appearance-in">
          <Alert color={alertState.color} title={alertState.message} />
        </div>
      )}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-lg-mobile md:text-display-lg font-display-lg text-on-surface flex items-center gap-2">
            <span
              className="material-symbols-outlined text-error text-[40px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
            Piutang (Accounts Receivable)
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">
            Monitor dan kelola tagihan pelanggan yang belum dibayar.
          </p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-error-container/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ba1a1a]">
                money_off
              </span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
              Total Piutang
            </h3>
          </div>
          <div className="text-display-sm font-display-sm text-on-surface mb-2">
            {loadingSummary ? (
              <Skeleton className="h-10 w-32 rounded-lg" />
            ) : (
              formatRupiah(summary?.totalAmount ?? 0)
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-warning">
                receipt_long
              </span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
              Order Belum Lunas
            </h3>
          </div>
          <div className="text-display-sm font-display-sm text-on-surface mb-2">
            {loadingSummary ? (
              <Skeleton className="h-10 w-24 rounded-lg" />
            ) : (
              `${summary?.unpaidCount ?? 0} Order`
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-stack-lg shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">
                group
              </span>
            </div>
            <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
              Pelanggan
            </h3>
          </div>
          <div className="text-display-sm font-display-sm text-on-surface mb-2">
            {loadingSummary ? (
              <Skeleton className="h-10 w-24 rounded-lg" />
            ) : (
              `${summary?.customerCount ?? 0} Orang`
            )}
          </div>
        </div>
      </div>

      {/* Aging Analysis */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm mb-10">
        <h3 className="text-headline-md font-headline-md text-on-background mb-6">
          Aging Analysis (Umur Piutang)
        </h3>
        {loadingAging ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {aging?.map((bucket, i) => (
              <div
                key={bucket.label}
                className={`p-4 rounded-lg border ${
                  i === 0
                    ? "bg-success/5 border-success/20"
                    : i === 1
                      ? "bg-warning/5 border-warning/20"
                      : i === 2
                        ? "bg-[rgb(249,115,22)]/5 border-[rgb(249,115,22)]/20"
                        : "bg-error/5 border-error/20"
                }`}
              >
                <p className="text-label-sm font-bold text-on-surface-variant mb-1">
                  {bucket.label}
                </p>
                <p className="text-title-lg font-bold text-on-background mb-1">
                  {formatRupiah(bucket.amount)}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {bucket.count} order
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer List */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/20 overflow-hidden flex flex-col p-6">
        <h3 className="text-headline-md font-headline-md text-on-background mb-4">
          Daftar Pelanggan dengan Piutang
        </h3>
        <div className="overflow-x-auto w-full">
          <Table
            aria-label="Customer Receivables Table"
            removeWrapper
            shadow="none"
            classNames={{ thead: loadingCustomers ? "hidden" : "" }}
          >
            <TableHeader>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                PELANGGAN
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                TOTAL PIUTANG
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                JUMLAH ORDER
              </TableColumn>
              <TableColumn className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                ORDER TERTUA
              </TableColumn>
              <TableColumn
                align="center"
                className="bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-center"
              >
                AKSI
              </TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loadingCustomers}
              loadingContent={<TableSkeleton rows={5} columns={5} />}
              emptyContent={
                <EmptyState
                  icon="receipt_long"
                  title="Tidak ada piutang"
                  description="Semua pelanggan sudah melunasi pembayaran."
                />
              }
            >
              {(customers ?? []).map((customer) => (
                <TableRow
                  key={customer.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-bright"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} />
                      <div>
                        <p className="text-label-md font-bold text-on-background">
                          {customer.name}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {customer.phone ?? "-"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-label-md font-bold text-error">
                      {formatRupiah(customer.totalAmount)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="warning">
                      {customer.orderCount} Order
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-label-sm text-on-surface-variant">
                      {new Date(customer.oldestOrderDate).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      startContent={
                        <span className="material-symbols-outlined text-[16px]">
                          chat
                        </span>
                      }
                      isLoading={
                        sendReminder.isPending &&
                        sendReminder.variables === customer.id
                      }
                      onPress={() =>
                        handleSendReminder(customer.id, customer.name)
                      }
                    >
                      Remind
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
