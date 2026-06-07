import { Module } from "@nestjs/common";
import { OverviewController } from "./overview/overview.controller";
import { OverviewService } from "./overview/overview.service";
import { InventoryController } from "./inventory/inventory.controller";
import { InventoryService } from "./inventory/inventory.service";
import { AppLogger } from "./common/app.logger";

@Module({
  controllers: [OverviewController, InventoryController],
  providers: [OverviewService, InventoryService, AppLogger],
})
export class AppModule {}
