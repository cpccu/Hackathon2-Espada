import { IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserStatusDto {
  @ApiProperty({
    example: true,
    description: "Active status flag (true = active, false = deactivated)",
  })
  @IsBoolean()
  isActive!: boolean;
}
