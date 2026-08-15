"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect } from "react";
import {
    ApiError,
    get,
    post,
    setAccessToken,
    setSessionExpiredHandler,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Role, Session } from "@/lib/types";

interface AuthContextValue {
    session: Session | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<Session>;
    logout: () => Promise<void>;
    hasRole: (...roles: Role[]) => boolean;
    /** Where this user belongs when they land on a bare authenticated route. */
    homePath: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const homeFor = (session: Session | null): string => {
    if (!session) return "/login";
    if (session.user.role === "PLATFORM_ADMIN") return "/admin";
    // A PENDING org has registered but never paid — it belongs at checkout,
    // not inside the product.
    if (session.organization?.status === "PENDING") return "/checkout/retry";
    if (session.user.role === "ORG_ADMIN") return "/org";
    return "/me";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: session, isLoading } = useQuery({
        queryKey: queryKeys.session,
        // The access token lives in memory, so a page reload starts with none.
        // This 401s, the interceptor spends the refresh cookie, and the retry
        // succeeds — one call rehydrates the session.
        queryFn: () => get<Session>("/auth/me"),
        retry: false,
        staleTime: 5 * 60_000,
    });

    // When refresh fails, drop the cache so no tenant's data survives into the
    // next session. Deliberately no redirect: on a public page "not signed in"
    // is the normal state, and bouncing an anonymous visitor off the landing
    // page to /login would be wrong. AppShell owns the redirect, because it is
    // the only place that knows the route required a session.
    //
    // Note the predicate: clearing the whole cache would evict the session
    // query itself, whose mounted observer would refetch, 401 again, and clear
    // again — an endless refresh loop. Everything *except* the session goes.
    useEffect(() => {
        setSessionExpiredHandler(() => {
            queryClient.removeQueries({
                predicate: (query) => query.queryKey[0] !== queryKeys.session[0],
            });
        });
        return () => setSessionExpiredHandler(null);
    }, [queryClient]);

    const loginMutation = useMutation({
        mutationFn: async (vars: { email: string; password: string }) => {
            const data = await post<{ accessToken: string }>("/auth/login", vars);
            setAccessToken(data.accessToken);
            return get<Session>("/auth/me");
        },
        onSuccess: (next) => queryClient.setQueryData(queryKeys.session, next),
    });

    const login = useCallback(
        (email: string, password: string) =>
            loginMutation.mutateAsync({ email, password }),
        [loginMutation],
    );

    const logout = useCallback(async () => {
        try {
            await post("/auth/logout");
        } catch (error) {
            // A failed logout call must not strand the user in a signed-in UI.
            if (!(error instanceof ApiError)) throw error;
        }
        setAccessToken(null);
        queryClient.clear();
        router.replace("/login");
    }, [queryClient, router]);

    const current = session ?? null;

    const hasRole = useCallback(
        (...roles: Role[]) => !!current && roles.includes(current.user.role),
        [current],
    );

    return (
        <AuthContext.Provider
            value={{
                session: current,
                isLoading,
                login,
                logout,
                hasRole,
                homePath: homeFor(current),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return context;
}
