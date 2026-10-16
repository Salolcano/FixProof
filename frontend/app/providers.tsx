"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { WalletProvider } from "@/lib/genlayer/WalletProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient for the life of the page.
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 2000, refetchOnWindowFocus: false } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
      <Toaster position="top-right" theme="light" richColors closeButton offset="80px" />
    </QueryClientProvider>
  );
}
