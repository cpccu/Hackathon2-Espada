import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from "class-validator";

export class CreateBatchDto {
  @ApiProperty({
    example: "b5181e63-5cf6-4f81-a52f-d4d7af1d9ee0",
    description: "UUID of the Department",
  })
  @IsNotEmpty({ message: "departmentId is required" })
  @IsUUID("4", { message: "departmentId must be a valid UUIDv4" })
  departmentId!: string;

  @ApiProperty({
    example: 71,
    description: "Academic batch number (positive integer)",
    minimum: 1,
  })
  @IsNotEmpty({ message: "batchNumber is required" })
  @Type(() => Number)
  @IsInt({ message: "batchNumber must be an integer" })
  @Min(1, { message: "batchNumber must be greater than 0" })
  batchNumber!: number;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the batch is active",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
