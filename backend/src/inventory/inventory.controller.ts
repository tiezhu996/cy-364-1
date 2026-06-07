import { Controller, Get, Query, Put, Param, Body, Post } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import type { StockQueryDto, StockUpdateDto, AlertResolveDto } from "./inventory.dto";

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("stores")
  getStores() {
    return this.inventoryService.getStores();
  }

  @Get("api/stores")
  apiGetStores() {
    return this.inventoryService.getStores();
  }

  @Get("skus")
  getSkus() {
    return this.inventoryService.getSkus();
  }

  @Get("api/skus")
  apiGetSkus() {
    return this.inventoryService.getSkus();
  }

  @Get("stocks")
  getStockList(@Query() query: StockQueryDto) {
    return this.inventoryService.getStockList(query);
  }

  @Get("api/stocks")
  apiGetStockList(@Query() query: StockQueryDto) {
    return this.inventoryService.getStockList(query);
  }

  @Put("stocks/:id")
  updateStock(@Param("id") id: string, @Body() dto: StockUpdateDto) {
    return this.inventoryService.updateStock(Number(id), dto);
  }

  @Put("api/stocks/:id")
  apiUpdateStock(@Param("id") id: string, @Body() dto: StockUpdateDto) {
    return this.inventoryService.updateStock(Number(id), dto);
  }

  @Get("alerts")
  getAlerts(@Query("status") status?: string) {
    return this.inventoryService.getAlerts(status);
  }

  @Get("api/alerts")
  apiGetAlerts(@Query("status") status?: string) {
    return this.inventoryService.getAlerts(status);
  }

  @Get("alerts/count")
  getAlertCount() {
    return this.inventoryService.getAlertCount();
  }

  @Get("api/alerts/count")
  apiGetAlertCount() {
    return this.inventoryService.getAlertCount();
  }

  @Post("alerts/:id/resolve")
  resolveAlert(@Param("id") id: string, @Body() dto: AlertResolveDto) {
    return this.inventoryService.resolveAlert(Number(id), dto);
  }

  @Post("api/alerts/:id/resolve")
  apiResolveAlert(@Param("id") id: string, @Body() dto: AlertResolveDto) {
    return this.inventoryService.resolveAlert(Number(id), dto);
  }
}
