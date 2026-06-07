export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  status: string;
  metric: string;
}

export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone: string;
}

export interface OperationRecord {
  key: string;
  name: string;
  owner: string;
  status: string;
  metric: string;
  priority: string;
}

export interface AlertSummary {
  pending: number;
  resolved: number;
  total: number;
}

export interface OverviewResponse {
  appName: string;
  appCode: string;
  description: string;
  features: FeatureItem[];
  kpis: KpiItem[];
  records: OperationRecord[];
  alertSummary?: AlertSummary;
}

export interface Store {
  id: number;
  name: string;
  address?: string;
  manager?: string;
  phone?: string;
  status: string;
  createdAt: string;
}

export interface Sku {
  id: number;
  skuCode: string;
  name: string;
  spec?: string;
  barcode?: string;
  category?: string;
  unit: string;
  safetyStock: number;
  createdAt: string;
}

export interface StockItem {
  id: number;
  storeId: number;
  skuId: number;
  quantity: number;
  updatedAt: string;
  store: {
    id: number;
    name: string;
    manager?: string;
  };
  sku: {
    id: number;
    skuCode: string;
    name: string;
    spec?: string;
    category?: string;
    unit: string;
    safetyStock: number;
  };
  isLowStock: boolean;
  shortage: number;
  status: "low" | "normal";
}

export interface StockListResponse {
  list: StockItem[];
  alertCount: number;
  totalCount: number;
  normalCount: number;
}

export interface StockAlert {
  id: number;
  stockId: number;
  storeId: number;
  skuId: number;
  currentQty: number;
  threshold: number;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  store: {
    id: number;
    name: string;
    manager?: string;
    phone?: string;
  };
  sku: {
    id: number;
    skuCode: string;
    name: string;
    spec?: string;
    unit: string;
  };
}

export interface StockQueryParams {
  storeId?: number;
  skuId?: number;
  filter?: "all" | "low" | "normal";
  keyword?: string;
}

export interface StockUpdateRequest {
  quantity: number;
  operator?: string;
}

