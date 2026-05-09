import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { Pharmacy } from '../pharmacies/entities/pharmacy.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepo: Repository<Pharmacy>,
  ) {}

  private async getPharmacyForOwner(userId: string): Promise<Pharmacy> {
    const pharmacy = await this.pharmacyRepo.findOne({
      where: { owner: { id: userId } },
    });
    if (!pharmacy) throw new NotFoundException('No pharmacy linked to your account');
    return pharmacy;
  }

  async getByPharmacist(userId: string) {
    const pharmacy = await this.getPharmacyForOwner(userId);
    return this.inventoryRepo.find({
      where: { pharmacyId: pharmacy.id },
      relations: ['medicine'],
      order: { medicine: { name: 'ASC' } },
    });
  }

  async addItem(userId: string, data: { medicineId: string; stock: number; price: number; expiryDate?: string; lowStockThreshold?: number }) {
    const pharmacy = await this.getPharmacyForOwner(userId);
    const item = this.inventoryRepo.create({
      pharmacyId: pharmacy.id,
      medicineId: data.medicineId,
      stock: data.stock,
      price: data.price,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      lowStockThreshold: data.lowStockThreshold ?? 10,
    });
    return this.inventoryRepo.save(item);
  }

  async updateItem(itemId: string, data: Partial<InventoryItem>, userId: string) {
    const pharmacy = await this.getPharmacyForOwner(userId);
    const item = await this.inventoryRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Inventory item #${itemId} not found`);
    if (item.pharmacyId !== pharmacy.id) throw new ForbiddenException('Not your inventory item');
    await this.inventoryRepo.update(itemId, data);
    return this.inventoryRepo.findOne({ where: { id: itemId }, relations: ['medicine'] });
  }

  async removeItem(itemId: string, userId: string) {
    const pharmacy = await this.getPharmacyForOwner(userId);
    const item = await this.inventoryRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException(`Inventory item #${itemId} not found`);
    if (item.pharmacyId !== pharmacy.id) throw new ForbiddenException('Not your inventory item');
    return this.inventoryRepo.remove(item);
  }
}
