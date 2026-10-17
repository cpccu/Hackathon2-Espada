import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../generated/prisma/client.js";

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.CLUB_ADMIN,
    description: "New role to assign to the user",
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
