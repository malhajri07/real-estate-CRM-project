import { useQuery } from "@tanstack/react-query";

type LoginsSeriesPoint = {
  date: string;
  logins: number;
  uniqueUsers: number;
};

type RPMSeriesPoint = {
  timestamp: string;
  requests: number;
  errors: number;
};

type EndpointMetric = {
  endpoint: string;
  volume: number;
  errorRate: number;
};

type LoginsSeriesData = {
  series: LoginsSeriesPoint[];
};

type RPMSeriesData = {
  series: RPMSeriesPoint[];
};

type TopEndpointsData = {
  endpoints: EndpointMetric[];
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const normalizeLoginsSeries = (payload: unknown): LoginsSeriesData => {
  const source =
    payload && typeof payload === "object" && payload !== null
      ? (Array.isArray((payload as any).series) ? (payload as any).series : Array.isArray(payload) ? payload : [])
      : [];

  const series: LoginsSeriesPoint[] = source
    .map((entry: any): LoginsSeriesPoint | null => {
      if (!entry || typeof entry !== "object") return null;
      const dateValue = toString(entry.date ?? entry.day ?? entry.label, "");
      if (!dateValue) return null;
      const logins = toNumber(entry.logins ?? entry.count ?? entry.total, 0);
      const uniqueUsers = toNumber(entry.uniqueUsers ?? entry.unique ?? entry.distinct ?? logins, logins);
      return { date: dateValue, logins, uniqueUsers };
    })
    .filter((point: LoginsSeriesPoint | null): point is LoginsSeriesPoint => Boolean(point));

  return { series };
};

const normalizeRPMSeries = (payload: unknown): RPMSeriesData => {
  const source =
    payload && typeof payload === "object" && payload !== null
      ? (Array.isArray((payload as any).series) ? (payload as any).series : Array.isArray(payload) ? payload : [])
      : [];

  const series: RPMSeriesPoint[] = source
    .map((entry: any): RPMSeriesPoint | null => {
      if (!entry || typeof entry !== "object") return null;
      const timestampValue = toString(entry.timestamp ?? entry.time ?? entry.label, "");
      if (!timestampValue) return null;
      const requests = toNumber(entry.requests ?? entry.count ?? entry.total, 0);
      const errors = toNumber(entry.errors ?? entry.errorCount ?? entry.failures, 0);
      return { timestamp: timestampValue, requests, errors };
    })
    .filter((point: RPMSeriesPoint | null): point is RPMSeriesPoint => Boolean(point));

  return { series };
};

const normalizeTopEndpoints = (payload: unknown): TopEndpointsData => {
  const source =
    payload && typeof payload === "object" && payload !== null
      ? (Array.isArray((payload as any).endpoints) ? (payload as any).endpoints : Array.isArray(payload) ? payload : [])
      : [];

  const endpoints: EndpointMetric[] = source
    .map((entry: any): EndpointMetric | null => {
      if (!entry || typeof entry !== "object") return null;
      const endpoint = toString(entry.endpoint ?? entry.path ?? entry.name, "");
      if (!endpoint) return null;
      const volume = toNumber(entry.volume ?? entry.count ?? entry.totalRequests, 0);
      const errorRateRaw = entry.errorRate ?? entry.error_rate ?? entry.failPercentage;
      const errorRate = toNumber(errorRateRaw, 0);
      return { endpoint, volume, errorRate };
    })
    .filter((metric: EndpointMetric | null): metric is EndpointMetric => Boolean(metric));

  return { endpoints };
};

const fetchAndNormalize = async <T>(
  url: string,
  normalizer: (payload: unknown) => T,
  errorMessage: string
): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`${errorMessage} (${response.status})`);
  }

  const payload = await response.json().catch(() => null);
  return normalizer(payload);
};

export const useLoginsSeries = () =>
  useQuery({
    queryKey: ["rbac-dashboard", "analytics", "logins-series"],
    queryFn: () =>
      fetchAndNormalize("/api/rbac-admin/analytics/logins-series", normalizeLoginsSeries, "Failed to load login analytics"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

export const useRPMSeries = () =>
  useQuery({
    queryKey: ["rbac-dashboard", "analytics", "rpm-series"],
    queryFn: () =>
      fetchAndNormalize("/api/rbac-admin/analytics/rpm-series", normalizeRPMSeries, "Failed to load RPM analytics"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

export const useTopEndpoints = () =>
  useQuery({
    queryKey: ["rbac-dashboard", "analytics", "top-endpoints"],
    queryFn: () =>
      fetchAndNormalize("/api/rbac-admin/analytics/top-endpoints", normalizeTopEndpoints, "Failed to load endpoint analytics"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
