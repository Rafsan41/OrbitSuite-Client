"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "./api-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    // Created in state, not at module scope: a module-level client would be
    // shared across requests on the server and leak one tenant's cache into
    // another's render.
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        refetchOnWindowFocus: false,
                        retry: (failureCount, error) => {
                            // 401/403/404 will not succeed on a retry, and
                            // retrying a 401 fights the refresh interceptor.
                            if (error instanceof ApiError && error.status < 500) {
                                return false;
                            }
                            return failureCount < 2;
                        },
                    },
                    mutations: { retry: false },
                },
            }),
    );

    return (
        <QueryClientProvider client={client}>
            {children}
            {/* shadcn's wrapper already maps sonner onto the popover tokens and
                follows next-themes, so only placement is set here. */}
            <Toaster position="top-right" />
        </QueryClientProvider>
    );
}
