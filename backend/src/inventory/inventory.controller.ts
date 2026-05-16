import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('inventory')
@ApiBearerAuth('JWT')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PHARMACIST, UserRole.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getInventory(@Request() req: any) {
    return this.inventoryService.getByPharmacist(req.user.id);
  }

  @Post()
  addItem(@Request() req: any, @Body() body: any) {
    return this.inventoryService.addItem(req.user.id, body);
  }

  @Patch(':id')
  updateItem(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.inventoryService.updateItem(id, body, req.user.id);
  }

  @Delete(':id')
  removeItem(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.removeItem(id, req.user.id);
  }
}
