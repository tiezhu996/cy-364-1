import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import type { StockQueryDto, StockUpdateDto, AlertResolveDto } from "./inventory.dto";

const prisma = new PrismaClient();

@Injectable()
export class InventoryService {
  async getStores() {
    return prisma.store.findMany({
      where: { status: "active" },
      orderBy: { id: "asc" },
    });
  }

  async getSkus() {
    return prisma.sku.findMany({
      orderBy: { id: "asc" },
    });
  }

  async getStockList(query: StockQueryDto) {
    const { storeId, skuId, filter, keyword } = query;

    const where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }
    if (skuId) {
      where.skuId = skuId;
    }
    if (keyword) {
      where.OR = [
        { store: { name: { contains: keyword } } },
        { sku: { name: { contains: keyword } } },
        { sku: { skuCode: { contains: keyword } } },
      ];
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, manager: true } },
        sku: { select: { id: true, skuCode: true, name: true, spec: true, category: true, unit: true, safetyStock: true } },
      },
      orderBy: [
        { storeId: "asc" },
        { skuId: "asc" },
      ],
    });

    const stocksWithStatus = stocks.map((stock) => {
      const isLow = stock.quantity < stock.sku.safetyStock;
      const shortage = Math.max(0, stock.sku.safetyStock - stock.quantity);
      return {
        ...stock,
        isLowStock: isLow,
        shortage,
        status: isLow ? "low" : "normal",
      };
    });

    let filtered = stocksWithStatus;
    if (filter === "low") {
      filtered = stocksWithStatus.filter((s) => s.isLowStock);
    } else if (filter === "normal") {
      filtered = stocksWithStatus.filter((s) => !s.isLowStock);
    }

    filtered.sort((a, b) => {
      if (a.isLowStock && !b.isLowStock) return -1;
      if (!a.isLowStock && b.isLowStock) return 1;
      if (a.isLowStock && b.isLowStock) {
        return b.shortage - a.shortage;
      }
      return 0;
    });

    const alertCount = stocksWithStatus.filter((s) => s.isLowStock).length;
    const totalCount = stocksWithStatus.length;

    return {
      list: filtered,
      alertCount,
      totalCount,
      normalCount: totalCount - alertCount,
    };
  }

  async updateStock(stockId: number, dto: StockUpdateDto) {
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: { sku: true },
    });

    if (!stock) {
      throw new Error("Stock record not found");
    }

    const updatedStock = await prisma.stock.update({
      where: { id: stockId },
      data: {
        quantity: dto.quantity,
        updatedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true } },
        sku: { select: { id: true, skuCode: true, name: true, safetyStock: true, unit: true } },
      },
    });

    const isLow = updatedStock.quantity < updatedStock.sku.safetyStock;

    const existingAlert = await prisma.stockAlert.findUnique({
      where: { stockId },
    });

    if (isLow) {
      if (existingAlert) {
        await prisma.stockAlert.update({
          where: { id: existingAlert.id },
          data: {
            currentQty: updatedStock.quantity,
            threshold: updatedStock.sku.safetyStock,
            status: "pending",
          },
        });
      } else {
        await prisma.stockAlert.create({
          data: {
            stockId: updatedStock.id,
            storeId: updatedStock.storeId,
            skuId: updatedStock.skuId,
            currentQty: updatedStock.quantity,
            threshold: updatedStock.sku.safetyStock,
            status: "pending",
          },
        });
      }
    } else if (existingAlert && existingAlert.status === "pending") {
      await prisma.stockAlert.update({
        where: { id: existingAlert.id },
        data: {
          status: "resolved",
          resolvedAt: new Date(),
          currentQty: updatedStock.quantity,
        },
      });
    }

    return {
      ...updatedStock,
      isLowStock: isLow,
      shortage: Math.max(0, updatedStock.sku.safetyStock - updatedStock.quantity),
      status: isLow ? "low" : "normal",
    };
  }

  async getAlerts(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return prisma.stockAlert.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, manager: true, phone: true } },
        sku: { select: { id: true, skuCode: true, name: true, spec: true, unit: true } },
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
    });
  }

  async getAlertCount() {
    const pending = await prisma.stockAlert.count({
      where: { status: "pending" },
    });
    const resolved = await prisma.stockAlert.count({
      where: { status: "resolved" },
    });
    return { pending, resolved, total: pending + resolved };
  }

  async resolveAlert(alertId: number, _dto: AlertResolveDto) {
    const alert = await prisma.stockAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new Error("Alert not found");
    }

    return prisma.stockAlert.update({
      where: { id: alertId },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true } },
        sku: { select: { id: true, skuCode: true, name: true } },
      },
    });
  }
}
