import { toast } from "sonner";

export const success = (message: string, options?: { description?: string }) =>
  toast.success(message, { duration: 4000, ...options });

export const error = (message: string, options?: { description?: string }) =>
  toast.error(message, { duration: 6000, ...options });

export const info = (message: string, options?: { description?: string }) =>
  toast.info(message, { duration: 3000, ...options });
