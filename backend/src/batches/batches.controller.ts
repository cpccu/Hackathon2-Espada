import {
  Body,
  Controller,
  Delete,
  Get,
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
import { BatchesService } from "./batches.service.js";
import {
  CreateBatchDto,
  QueryBatchesDto,
  UpdateBatchDto,
} from "./dto/index.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/interfaces/authenticated-user.interface.js";

@ApiTags("Batches")
@Controller("batches")
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  // ---------------------------------------------------------------------------
  // Public/Student: List Batches
  // ---------------------------------------------------------------------------

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Browse academic batches",
    description:
      "Public endpoint. Returns active batches sorted by batchNumber. Supports departmentId filtering.",
  })
  @ApiResponse({ status: 200, description: "List of academic batches" })
  async getBatches(
    @Query() query: QueryBatchesDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.batchesService.findAll(query, user);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Get batch by ID" })
  @ApiParam({ name: "id", description: "Batch UUID" })
  @ApiResponse({ status: 200, description: "Batch details" })
  @ApiResponse({ status: 404, description: "Batch not found" })
  async getBatch(@Param("id", ParseUUIDPipe) id: string) {
    return this.batchesService.findById(id);
  }

  // ---------------------------------------------------------------------------
  // Management: Create Batch (ADMIN, RESOURCE_ADMIN)
  // ---------------------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Create a new academic batch",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. Requires valid department and unique batchNumber within department.",
  })
  @ApiResponse({ status: 201, description: "Batch created successfully" })
  @ApiResponse({ status: 400, description: "Invalid department or input" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({
    status: 409,
    description: "Batch already exists in department",
  })
  async createBatch(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  // ---------------------------------------------------------------------------
  // Management: Update Batch (ADMIN, RESOURCE_ADMIN)
  // ---------------------------------------------------------------------------

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Update batch details",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. Cannot violate department-scoped uniqueness.",
  })
  @ApiParam({ name: "id", description: "Batch UUID" })
  @ApiResponse({ status: 200, description: "Batch updated successfully" })
  @ApiResponse({ status: 404, description: "Batch not found" })
  @ApiResponse({
    status: 409,
    description: "Duplicate batch number in department",
  })
  async updateBatch(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, dto);
  }

  // ---------------------------------------------------------------------------
  // Management: Deactivate Batch (ADMIN, RESOURCE_ADMIN)
  // ---------------------------------------------------------------------------

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESOURCE_ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Deactivate batch",
    description:
      "Restricted to ADMIN and RESOURCE_ADMIN. Soft-deactivates the batch rather than deleting history.",
  })
  @ApiParam({ name: "id", description: "Batch UUID" })
  @ApiResponse({ status: 200, description: "Batch deactivated successfully" })
  @ApiResponse({ status: 404, description: "Batch not found" })
  async deactivateBatch(@Param("id", ParseUUIDPipe) id: string) {
    return this.batchesService.deactivate(id);
  }
}
