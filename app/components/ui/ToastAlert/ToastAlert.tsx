"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { HiCheckCircle, HiXCircle, HiX } from "react-icons/hi"; // Import from react-icons

// --- Types ---
type ToastType = "success" | "error";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// --- Provider Component ---
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prevToasts) => [{ id, message, type }, ...prevToasts]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

// --- Toaster Container ---
const Toaster = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          removeToast={removeToast}
        />
      ))}
    </div>
  );
};

// --- Single Toast Item ---
const ToastItem = ({
  id,
  message,
  type,
  removeToast,
}: Toast & { removeToast: (id: number) => void }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => removeToast(id), 500); // Wait for animation to finish
    }, 5000); // Set duration to 5 seconds

    return () => clearTimeout(timer);
  }, [id, removeToast]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(id), 500);
  };

  const isSuccess = type === "success";

  return (
    <div
      className={`toast-item ${isExiting ? "toast-leave" : "toast-enter"} flex items-start p-4 rounded-lg shadow-lg w-full ${
        isSuccess ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
      }`}
    >
      <div className="flex-shrink-0">
        {isSuccess ? (
          <HiCheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <HiXCircle className="w-6 h-6 text-red-500" />
        )}
      </div>
      <div className="ml-3 mr-4 flex-1 text-sm font-medium">
        <p>{message}</p>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={handleClose}
          className={`-mx-1.5 -my-1.5 p-1.5 rounded-md inline-flex ${
            isSuccess ? "hover:bg-green-100" : "hover:bg-red-100"
          }`}
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
