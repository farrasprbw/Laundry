import { useState } from "react";
import apiClient from "../../lib/api-client";
import {
  Button,
  Tabs,
  Tab,
  Card,
  CardBody,
  Chip,
  Spinner,
} from "@nextui-org/react";
import type { Order } from "../../types/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlert } from "../../contexts/AlertContext";

export function WorkerDashboard() {
  const [selectedTab, setSelectedTab] = useState("process");
  const [processedOrderIds, setProcessedOrderIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const { data: processOrdersData, isLoading: loadingProcess } = useQuery({
    queryKey: ["orders", "process"],
    queryFn: async () => {
      const res = await apiClient.get("/orders", {
        params: { status: "PROCESS", limit: 50 },
      });
      return res.data.data as Order[];
    },
    refetchInterval: 15000,
  });

  const { data: finishedOrdersData, isLoading: loadingFinished } = useQuery({
    queryKey: ["orders", "finished"],
    queryFn: async () => {
      const res = await apiClient.get("/orders", {
        params: { status: "FINISHED", limit: 50 },
      });
      return res.data.data as Order[];
    },
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: unknown) => {
      const error = err as import("axios").AxiosError<{ error: string }>;
      showAlert(error.response?.data?.error || "Gagal mengubah status", "danger");
    },
  });

  const handleUpdateStatus = (id: string, newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus }, {
      onSuccess: () => {
        showAlert("Status cucian berhasil diperbarui", "success");
        setProcessedOrderIds(prev => new Set(prev).add(`${id}-${newStatus}`));
      }
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PROCESS": return "Sedang Dicuci";
      case "FINISHED": return "Selesai";
      case "TAKEN": return "Sudah Diambil";
      default: return status;
    }
  };

  const renderOrderCard = (
    order: Order,
    nextStatus: string,
    actionLabel: string,
    actionIcon: string,
    color: "primary" | "success" | "secondary" | "warning",
  ) => {
    const isProcessed = processedOrderIds.has(`${order.id}-${nextStatus}`);
    
    return (
    <Card
      key={order.id}
      className="mb-4 shadow-sm border border-outline-variant/30"
    >
      <CardBody className="flex flex-col gap-3 p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-label-md font-bold text-primary">
              {order.invoiceNumber}
            </p>
            <p className="text-body-md font-medium text-on-surface">
              {order.customer?.name || "Unknown"}
            </p>
            <p className="text-label-sm text-on-surface-variant mt-1">
              {order.items?.map(i => i.category?.name).join(", ") || "Laundry"}
            </p>
          </div>
          <Chip size="sm" color={isProcessed ? "default" : color} variant="flat">
            {getStatusLabel(isProcessed ? nextStatus : order.status)}
          </Chip>
        </div>

        <div className="flex justify-between items-center mt-2">
          <p className="text-title-md font-bold text-sm">
            {order.items?.map(i => `${parseFloat(i.quantity)} ${i.category?.unit || "kg"}`).join(", ")}
          </p>
          <Button
            size="sm"
            color={isProcessed ? "default" : color}
            isDisabled={isProcessed}
            isLoading={
              updateStatus.isPending && updateStatus.variables?.id === order.id
            }
            onPress={() => handleUpdateStatus(order.id, nextStatus)}
            startContent={
              !isProcessed && (
                <span className="material-symbols-outlined text-[16px]">
                  {actionIcon}
                </span>
              )
            }
          >
            {isProcessed ? "Berhasil" : actionLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
    );
  };

  return (
    <div className="pt-20 pb-24 px-4 w-full flex-1">
      <div className="mb-6">
        <h2 className="text-headline-md font-headline-md text-on-surface mb-2">
          Tugas Laundry
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Kelola status cucian dengan mudah.
        </p>
      </div>

      <Tabs
        aria-label="Order Tabs"
        fullWidth
        size="lg"
        selectedKey={selectedTab}
        onSelectionChange={(k) => setSelectedTab(k as string)}
        classNames={{
          tabList: "bg-surface-container-low rounded-xl p-1",
          cursor: "bg-primary rounded-lg",
          tab: "h-12",
          tabContent: "group-data-[selected=true]:text-white font-medium",
        }}
      >
        <Tab key="process" title="Sedang Dicuci">
          <div className="mt-4">
            {loadingProcess ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : processOrdersData?.length === 0 ? (
              <div className="text-center p-8 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                Tidak ada pesanan yang sedang dicuci.
              </div>
            ) : (
              processOrdersData?.map((order) =>
                renderOrderCard(
                  order,
                  "FINISHED",
                  "Selesai",
                  "check_circle",
                  "primary",
                ),
              )
            )}
          </div>
        </Tab>
        <Tab key="finished" title="Siap Diambil">
          <div className="mt-4">
            {loadingFinished ? (
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            ) : finishedOrdersData?.length === 0 ? (
              <div className="text-center p-8 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                Tidak ada pesanan yang siap diambil.
              </div>
            ) : (
              finishedOrdersData?.map((order) =>
                renderOrderCard(
                  order,
                  "TAKEN",
                  "Diambil",
                  "inventory_2",
                  "success",
                ),
              )
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
