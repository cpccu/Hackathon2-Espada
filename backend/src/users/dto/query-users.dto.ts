import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { UserRole } from "../../generated/prisma/client.js";

export class QueryUsersDto {
  @ApiPropertyOptional({
    example: "rafid",
    description:
      "Search filter for name, email, or student ID (case-insensitive)",
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.STUDENT,
    description: "Filter users by role",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: "ca000000-0000-4000-8000-000000000001",
    description: "Filter users by department UUID",
  })
  @IsOptional()
  @IsUUID("4")
  departmentId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Page number (1-indexed)",
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: "Items per page (max 50)",
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
