import { useState, useEffect, useCallback } from 'react';
import { printer, BluetoothPrinter, type PrinterStatus } from '../utils/thermal-printer';
import { buildLaundryReceipt, type ReceiptData } from '../utils/receipt-builder';

/**
 * Custom hook for managing Bluetooth thermal printer state.
 *
 * Provides:
 * - Printer connection status
 * - Connect / disconnect functions
 * - Print receipt function
 * - Error handling
 */
export function usePrinter() {
  const [status, setStatus] = useState<PrinterStatus>(printer.status);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(printer.deviceName);

  // Track if Web Bluetooth is supported
  const isSupported = BluetoothPrinter.isSupported();

  useEffect(() => {
    const handleStatus = (newStatus: PrinterStatus) => {
      setStatus(newStatus);
      setDeviceName(printer.deviceName);
      if (newStatus !== 'error') {
        setError(null);
      }
    };

    const handleError = (errMsg: string) => {
      setError(errMsg);
    };

    printer.on('statusChange', handleStatus);
    printer.on('error', handleError);

    return () => {
      printer.off('statusChange', handleStatus);
      printer.off('error', handleError);
    };
  }, []);

  /** Connect to a Bluetooth printer */
  const connect = useCallback(async () => {
    setError(null);
    const success = await printer.connect();
    if (success) {
      setDeviceName(printer.deviceName);
    }
    return success;
  }, []);

  /** Disconnect from the printer */
  const disconnect = useCallback(async () => {
    await printer.disconnect();
    setDeviceName(null);
  }, []);

  /** Print a receipt for an order */
  const printReceipt = useCallback(async (data: ReceiptData): Promise<boolean> => {
    if (!printer.isConnected) {
      setError('Printer tidak terhubung. Silakan hubungkan terlebih dahulu.');
      return false;
    }

    try {
      setError(null);
      const receiptBytes = buildLaundryReceipt(data);
      const success = await printer.print(receiptBytes);
      return success;
    } catch (error: unknown) {
      const err = error as Error;
      setError(`Gagal mencetak: ${err.message}`);
      return false;
    }
  }, []);

  /** Dismiss current error */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    status,
    error,
    deviceName,
    isSupported,
    isConnected: status === 'connected' || status === 'printing',
    isPrinting: status === 'printing',
    isConnecting: status === 'connecting',
    connect,
    disconnect,
    printReceipt,
    clearError,
  };
}
