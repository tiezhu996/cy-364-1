import { Injectable } from "@nestjs/common";
import { overviewData } from "./overview.data";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class OverviewService {
  constructor(private readonly inventoryService: InventoryService) {}

  async getOverview() {
    const alertCount = await this.inventoryService.getAlertCount();
    const pendingAlertCount = alertCount.pending;

    const features = overviewData.features.map((feature) => {
      if (feature.title === "库存实时同步与预警") {
        return {
          ...feature,
          status: "处理中",
          metric: `${pendingAlertCount} 单待处理`,
        };
      }
      return feature;
    });

    const kpis = overviewData.kpis.map((kpi) => {
      if (kpi.label === "待处理") {
        return {
          ...kpi,
          value: String(pendingAlertCount),
          trend: pendingAlertCount > 0 ? "需跟进" : "已处理",
          tone: pendingAlertCount > 0 ? "danger" : "success",
        };
      }
      return kpi;
    });

    const records = overviewData.records.map((record) => {
      if (record.name === "库存实时同步与预警") {
        let status = "排期中";
        let priority = "中";
        if (pendingAlertCount > 0) {
          status = "处理中";
          priority = "高";
        } else if (pendingAlertCount === 0) {
          status = "已上线";
          priority = "低";
        }
        return {
          ...record,
          status,
          metric: `${pendingAlertCount} 单`,
          priority,
        };
      }
      return record;
    });

    return {
      ...overviewData,
      features,
      kpis,
      records,
      alertSummary: alertCount,
    };
  }

  getHealth() {
    return { status: "ok" };
  }
}
