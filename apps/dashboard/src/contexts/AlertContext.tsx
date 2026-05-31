import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";

export type AlertColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

interface AlertInfo {
  id: number;
  message: string;
  color: AlertColor;
}

interface AlertContextType {
  showAlert: (message: string, color?: AlertColor) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);

  const showAlert = useCallback((message: string, color: AlertColor = "primary") => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, color }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 3000);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-[90vw]">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              layout
            >
              <Alert color={alert.color} hideIconWrapper className="shadow-lg border border-outline-variant/20">
                {alert.message}
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
