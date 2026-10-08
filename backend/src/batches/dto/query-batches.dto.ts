import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsUUID } from "class-validator";

export class QueryBatchesDto {
  @ApiPropertyOptional({
    example: "b5181e63-5cf6-4f81-a52f-d4d7af1d9ee0",
    description: "Filter batches by Department UUID",
  })
  @IsOptional()
  @IsUUID("4")
  departmentId?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Filter by active status",
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}
