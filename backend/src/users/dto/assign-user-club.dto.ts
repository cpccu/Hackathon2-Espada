import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignUserClubDto {
  @ApiProperty({
    example: "ca000000-0000-4000-8000-000000000001",
    description: "UUID of the club to assign to the user",
  })
  @IsUUID("4")
  clubId!: string;
}
