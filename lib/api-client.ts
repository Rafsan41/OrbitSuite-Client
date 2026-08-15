import axios, {
    AxiosError,
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
} from "axios";
import type { ApiEnvelope, FieldError, PageMeta } from "./types";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

/**
 * The access token lives in memory only — a 15-minute JWT in localStorage is
 * readable by any injected script and survives the tab. The long-lived refresh
 * token is an httpOnly cookie the browser attaches on its own; JS never sees it.
 */
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // without this the refresh cookie is never sent
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (accessToken) {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return config;
});

/** An error the UI can render: a message, and optionally per-field detail. */
export class ApiError extends Error {
    readonly status: number;
    readonly fieldErrors: FieldError[];

    constructor(message: string, status: number, fieldErrors: FieldError[] = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.fieldErrors = fieldErrors;
    }

    /** Field errors keyed by name, ready to hand to react-hook-form. */
    byField(): Record<string, string> {
        return Object.fromEntries(
            this.fieldErrors.map((e) => [e.field, e.message]),
        );
    }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Concurrent 401s must not each fire their own refresh — the backend rotates the
 * refresh token on every use, so a second refresh would present a token the
 * first one already invalidated and log the user out. All waiters share one
 * in-flight promise instead.
 */
let refreshInFlight: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
    refreshInFlight ??= axios
        .post<ApiEnvelope<{ accessToken: string }>>(
            `${BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true },
        )
        .then((res) => {
            const token = res.data.data.accessToken;
            setAccessToken(token);
            return token;
        })
        .finally(() => {
            refreshInFlight = null;
        });

    return refreshInFlight;
};

/** Called when refresh fails — wired up by the auth hook so this file stays UI-free. */
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
    onSessionExpired = handler;
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiEnvelope<null>>) => {
        const config = error.config as RetriableConfig | undefined;
        const status = error.response?.status ?? 0;

        // Refresh once per request. `_retried` is what stops a 401 on the retry
        // itself from looping forever.
        const isRefreshCall = config?.url?.includes("/auth/refresh");
        if (status === 401 && config && !config._retried && !isRefreshCall) {
            config._retried = true;
            try {
                const token = await refreshAccessToken();
                config.headers.set("Authorization", `Bearer ${token}`);
                return api.request(config);
            } catch {
                setAccessToken(null);
                onSessionExpired?.();
            }
        }

        const body = error.response?.data;
        throw new ApiError(
            body?.message ?? error.message ?? "Something went wrong",
            status,
            body?.errors ?? [],
        );
    },
);

/** Unwraps the envelope so callers deal in payloads, not `res.data.data`. */
export const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
    const res = await api.request<ApiEnvelope<T>>(config);
    return res.data.data;
};

/** Same, but keeps `meta` for paginated lists. */
export const requestList = async <T>(
    config: AxiosRequestConfig,
): Promise<{ data: T; meta: PageMeta | null }> => {
    const res = await api.request<ApiEnvelope<T>>(config);
    return { data: res.data.data, meta: res.data.meta ?? null };
};

export const get = <T>(url: string, params?: Record<string, unknown>) =>
    request<T>({ method: "GET", url, params });

export const getList = <T>(url: string, params?: Record<string, unknown>) =>
    requestList<T>({ method: "GET", url, params });

export const post = <T>(url: string, data?: unknown) =>
    request<T>({ method: "POST", url, data });

export const patch = <T>(url: string, data?: unknown) =>
    request<T>({ method: "PATCH", url, data });

export const del = <T>(url: string) => request<T>({ method: "DELETE", url });
