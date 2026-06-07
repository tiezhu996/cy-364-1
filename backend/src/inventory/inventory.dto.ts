import { IsInt, IsOptional, IsString, IsIn } from "class-validator";

export class StockQueryDto {
  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsOptional()
  @IsInt()
  skuId?: number;

  @IsOptional()
  @IsString()
  @IsIn(["all", "low", "normal"])
  filter?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class StockUpdateDto {
  @IsInt()
  quantity!: number;

  @IsOptional()
  @IsString()
  operator?: string;
}

export class AlertResolveDto {
  @IsOptional()
  @IsString()
  remark?: string;
}
