import { API_BASE_URL } from "../constants/app";
import type {
  OverviewResponse,
  Store,
  Sku,
  StockListResponse,
  StockAlert,
  AlertSummary,
  StockQueryParams,
  StockUpdateRequest,
  StockItem,
} from "../types";

export async function fetchOverview(): Promise<OverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/overview`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Overview request failed: ${response.status}`);
  }

  return response.json() as Promise<OverviewResponse>;
}

export async function fetchStores(): Promise<Store[]> {
  const response = await fetch(`${API_BASE_URL}/stores`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Stores request failed: ${response.status}`);
  }

  return response.json() as Promise<Store[]>;
}

export async function fetchSkus(): Promise<Sku[]> {
  const response = await fetch(`${API_BASE_URL}/skus`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Skus request failed: ${response.status}`);
  }

  return response.json() as Promise<Sku[]>;
}

export async function fetchStockList(
  params?: StockQueryParams
): Promise<StockListResponse> {
  const url = new URL(`${API_BASE_URL}/stocks`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Stock list request failed: ${response.status}`);
  }

  return response.json() as Promise<StockListResponse>;
}

export async function updateStock(
  stockId: number,
  data: StockUpdateRequest
): Promise<StockItem> {
  const response = await fetch(`${API_BASE_URL}/stocks/${stockId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Stock update request failed: ${response.status}`);
  }

  return response.json() as Promise<StockItem>;
}

export async function fetchAlerts(status?: string): Promise<StockAlert[]> {
  const url = new URL(`${API_BASE_URL}/alerts`);
  if (status) {
    url.searchParams.append("status", status);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Alerts request failed: ${response.status}`);
  }

  return response.json() as Promise<StockAlert[]>;
}

export async function fetchAlertCount(): Promise<AlertSummary> {
  const response = await fetch(`${API_BASE_URL}/alerts/count`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Alert count request failed: ${response.status}`);
  }

  return response.json() as Promise<AlertSummary>;
}

export async function resolveAlert(
  alertId: number,
  remark?: string
): Promise<StockAlert> {
  const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ remark }),
  });

  if (!response.ok) {
    throw new Error(`Resolve alert request failed: ${response.status}`);
  }

  return response.json() as Promise<StockAlert>;
}

