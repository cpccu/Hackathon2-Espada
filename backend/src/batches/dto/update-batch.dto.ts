import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class UpdateBatchDto {
  @ApiPropertyOptional({
    example: 72,
    description: "Updated batch number (positive integer)",
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "batchNumber must be an integer" })
  @Min(1, { message: "batchNumber must be greater than 0" })
  batchNumber?: number;

  @ApiPropertyOptional({
    example: false,
    description: "Toggle active/inactive status",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
