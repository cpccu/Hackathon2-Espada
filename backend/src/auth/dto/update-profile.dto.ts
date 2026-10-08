import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: "Rafid Hasan",
    description: "Full name of the user",
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  name?: string;

  @ApiPropertyOptional({
    example: "CSE-2023-142",
    description: "Student ID / Roll Number",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  studentId?: string;

  @ApiPropertyOptional({
    example: "5b695289-afb3-4008-b3ca-99ec3e86215c",
    description: "UUID of the managed Batch",
  })
  @IsOptional()
  @IsUUID(4, { message: "batchId must be a valid UUIDv4" })
  batchId?: string;

  @ApiPropertyOptional({
    example: "67",
    description: "Legacy batch string (fallback)",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  batch?: string;

  @ApiPropertyOptional({ example: "A", description: "Section name" })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  section?: string;

  @ApiPropertyOptional({
    example: "ca000000-0000-4000-8000-000000000001",
    description: "Department UUID",
  })
  @IsOptional()
  @IsUUID(4, { message: "departmentId must be a valid UUIDv4" })
  departmentId?: string;
}
