import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UsersService } from "./users.service.js";
import {
  AssignUserClubDto,
  QueryUsersDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from "./dto/index.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

@ApiTags("Admin Users")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: "List all users (Admin only)",
    description:
      "ADMIN only. Returns paginated list of users with optional search and role/department filtering.",
  })
  @ApiResponse({ status: 200, description: "Paginated users list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  async getUsers(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get user details (Admin only)",
    description: "ADMIN only. Returns safe user details by UUID.",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User details found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserById(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(":id/role")
  @ApiOperation({
    summary: "Change user role (Admin only)",
    description:
      "ADMIN only. Updates a user's role. If changing away from CLUB_ADMIN, existing club assignments are safely removed.",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User role updated successfully" })
  @ApiResponse({
    status: 400,
    description: "Validation error or unsafe role demotion",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUserRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usersService.updateRole(id, dto, admin);
  }

  @Patch(":id/status")
  @ApiOperation({
    summary: "Activate or deactivate user (Admin only)",
    description:
      "ADMIN only. Toggles user active status. Deactivating revokes all active refresh sessions and prevents access.",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  @ApiResponse({
    status: 400,
    description: "Cannot deactivate own account or last admin",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUserStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usersService.updateStatus(id, dto, admin);
  }

  @Get(":id/clubs")
  @ApiOperation({
    summary: "Get club assignments for a user (Admin only)",
    description:
      "ADMIN only. Returns all club assignments for the specified user.",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({
    status: 200,
    description: "List of club assignments for user",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserClubs(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.getUserClubs(id);
  }

  @Post(":id/clubs")
  @ApiOperation({
    summary: "Assign a CLUB_ADMIN user to a club (Admin only)",
    description:
      "ADMIN only. Assigns an active CLUB_ADMIN user to an active club.",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 201, description: "Club assignment created" })
  @ApiResponse({
    status: 400,
    description: "User is inactive or not CLUB_ADMIN, or club is inactive",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "User or club not found" })
  @ApiResponse({
    status: 409,
    description: "User is already an admin of this club",
  })
  async assignUserClub(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AssignUserClubDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usersService.assignClub(id, dto, admin);
  }

  @Delete(":id/clubs/:clubId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Remove a club assignment (Admin only)",
    description:
      "ADMIN only. Removes the specified club assignment from the user.",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiParam({ name: "clubId", description: "Club UUID" })
  @ApiResponse({
    status: 200,
    description: "Club assignment removed successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires ADMIN role" })
  @ApiResponse({ status: 404, description: "Assignment not found" })
  async removeUserClub(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("clubId", ParseUUIDPipe) clubId: string,
  ) {
    return this.usersService.removeClub(id, clubId);
  }
}
