import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationNode, LocationType } from './entities/location-node.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationNode)
    private readonly locationNodeRepo: Repository<LocationNode>,
  ) {}

  async getNodes(parentId?: string): Promise<LocationNode[]> {
    if (parentId) {
      return this.locationNodeRepo.find({
        where: { parent: { id: parentId } },
        order: { name: 'ASC' },
      });
    }
    // If no parentId, return the top level (PROVINCE)
    return this.locationNodeRepo.find({
      where: { type: LocationType.PROVINCE },
      order: { name: 'ASC' },
    });
  }

  /** Get direct children of a node (for cascading picker) */
  async getChildren(parentId: string): Promise<LocationNode[]> {
    return this.locationNodeRepo.find({
      where: { parent: { id: parentId } },
      order: { name: 'ASC' },
    });
  }

  async getAllNodes(): Promise<LocationNode[]> {
    return this.locationNodeRepo.find({
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async getNodeById(id: string): Promise<LocationNode | null> {
    return this.locationNodeRepo.findOne({ where: { id } });
  }

  /**
   * Calculates the distance between two geographical points using the Haversine formula.
   * @param lat1 Latitude of point 1 in decimal degrees
   * @param lon1 Longitude of point 1 in decimal degrees
   * @param lat2 Latitude of point 2 in decimal degrees
   * @param lon2 Longitude of point 2 in decimal degrees
   * @returns Distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
