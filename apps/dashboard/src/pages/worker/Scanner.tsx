import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import apiClient from "../../lib/api-client";
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Chip
} from "@nextui-org/react";
import type { Order } from "../../types/api";
import { useAlert } from "../../contexts/AlertContext";

export function Scanner() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader";

  useEffect(() => {
    // Initialize scanner
    const html5QrCode = new Html5Qrcode(regionId);
    scannerRef.current = html5QrCode;

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      scannerRef.current?.clear();
    };
  }, []);

  const startScanning = async () => {
    if (!scannerRef.current) return;
    
    try {
      setError(null);
      setScannedResult(null);
      setScannedOrder(null);
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Pause scanning on success
          if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(console.error);
          }
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore scan errors, they happen continuously until a QR is found
        }
      );
    } catch (err: unknown) {
      const error = err as Error;
      setError("Gagal mengakses kamera: " + (error.message || "Unknown error"));
    }
  };

  const handleScanSuccess = async (invoiceNumber: string) => {
    setScannedResult(invoiceNumber);
    setIsLoading(true);
    setError(null);
    try {
      // Find the order by exact invoice number
      const response = await apiClient.get('/orders', {
        params: { search: invoiceNumber, limit: 1 }
      });
      
      const orders = response.data.data as Order[];
      if (orders.length > 0 && orders[0].invoiceNumber === invoiceNumber) {
        setScannedOrder(orders[0]);
      } else {
        setError(`Invoice ${invoiceNumber} tidak ditemukan.`);
      }
    } catch (err: unknown) {
      setError("Gagal mengambil data pesanan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Order["status"]) => {
    setIsLoading(true);
    try {
      await apiClient.patch(`/orders/${id}/status`, { status: newStatus });
      setScannedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: unknown) {
      const error = err as import("axios").AxiosError<{ error: string }>;
      showAlert(error.response?.data?.error || "Gagal mengubah status", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-24 px-4 w-full flex-1 flex flex-col items-center">
      <div className="mb-6 w-full text-center">
        <h2 className="text-headline-md font-headline-md text-on-surface mb-2">Scanner QR</h2>
        <p className="text-body-md text-on-surface-variant">Arahkan kamera ke struk untuk memindai.</p>
      </div>

      {!scannedResult && (
        <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
          <div 
            id={regionId} 
            className="w-full rounded-2xl overflow-hidden bg-black aspect-square shadow-lg"
          ></div>
          
          <Button
            size="lg"
            color="primary"
            className="w-full font-bold shadow-md text-white rounded-full"
            onPress={startScanning}
            startContent={<span className="material-symbols-outlined">qr_code_scanner</span>}
          >
            Mulai Scan
          </Button>

          {error && <p className="text-error text-sm text-center px-4">{error}</p>}
        </div>
      )}

      {scannedResult && (
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4 animate-appearance-in">
          <Card className="shadow-lg border border-outline-variant/30">
            <CardBody className="p-6 flex flex-col gap-4 items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[32px] text-primary">receipt_long</span>
              </div>
              
              <h3 className="text-title-lg font-bold text-primary">{scannedResult}</h3>
              
              {isLoading ? (
                <Spinner label="Memuat pesanan..." className="my-4" />
              ) : scannedOrder ? (
                <div className="w-full flex flex-col gap-3 text-left bg-surface-container-lowest p-4 rounded-xl">
                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                    <span className="text-label-sm text-on-surface-variant">Pelanggan</span>
                    <span className="text-body-md font-bold">{scannedOrder.customer?.name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                    <span className="text-label-sm text-on-surface-variant">Layanan</span>
                    <span className="text-body-md">{scannedOrder.category?.name} - {scannedOrder.quantity} {scannedOrder.category?.unit}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-label-sm text-on-surface-variant">Status Saat Ini</span>
                    <Chip size="sm" color={
                      scannedOrder.status === 'PROCESS' ? 'primary' : 
                      scannedOrder.status === 'FINISHED' ? 'success' : 'default'
                    }>{scannedOrder.status}</Chip>
                  </div>

                  {/* Actions based on current status */}
                  <div className="mt-4 flex flex-col gap-2">
                    {scannedOrder.status === 'PROCESS' && (
                      <Button color="primary" onPress={() => handleUpdateStatus(scannedOrder.id, 'FINISHED')}>
                        Tandai Selesai
                      </Button>
                    )}
                    {scannedOrder.status === 'FINISHED' && (
                      <Button color="success" onPress={() => handleUpdateStatus(scannedOrder.id, 'TAKEN')}>
                        Tandai Diambil
                      </Button>
                    )}
                    {scannedOrder.status === 'TAKEN' && (
                      <p className="text-center text-label-sm text-on-surface-variant mt-2">Pesanan ini sudah diambil.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="my-4 text-error font-medium">{error}</div>
              )}

              <Button 
                variant="flat" 
                color="default" 
                className="w-full mt-4" 
                onPress={() => {
                  setScannedResult(null);
                  startScanning();
                }}
              >
                Scan Ulang
              </Button>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
