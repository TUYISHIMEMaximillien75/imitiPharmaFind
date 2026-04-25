import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pharmacy } from '../pharmacies/entities/pharmacy.entity';
import { SearchRequestDto } from './dto/search-request.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepository: Repository<Pharmacy>,
  ) {}

  async searchPharmacies(dto: SearchRequestDto): Promise<any[]> {
    const { medicineNames, latitude, longitude, insuranceId } = dto;
    const currentHour = new Date().getHours();

    this.logger.log(`Searching for medicines: ${medicineNames.join(', ')}`);

    if (!medicineNames || medicineNames.length === 0) {
      return [];
    }

    const query = this.pharmacyRepository.createQueryBuilder('pharmacy')
      .innerJoin('pharmacy.insurances', 'insurance', 'insurance.id = :insuranceId', { insuranceId })
      .innerJoin('pharmacy.inventory', 'inventory', 'inventory.stock > 0')
      .innerJoin('inventory.medicine', 'medicine', 'medicine.name IN (:...medicineNames)', { medicineNames })
      .andWhere(
        `((pharmacy.openingTime <= pharmacy.closingTime AND :currentHour >= pharmacy.openingTime AND :currentHour < pharmacy.closingTime) OR
         (pharmacy.openingTime > pharmacy.closingTime AND (:currentHour >= pharmacy.openingTime OR :currentHour < pharmacy.closingTime)))`,
        { currentHour }
      )
      // Note: TypeORM usually maps embedded fields like location.latitude to locationLatitude
      .addSelect(
        `(6371 * acos(cos(radians(:latitude)) * cos(radians("pharmacy"."locationLatitude")) * cos(radians("pharmacy"."locationLongitude") - radians(:longitude)) + sin(radians(:latitude)) * sin(radians("pharmacy"."locationLatitude"))))`,
        'distance'
      )
      .groupBy('pharmacy.id')
      .having('COUNT(DISTINCT medicine.id) = :medicineCount', { medicineCount: medicineNames.length })
      .orderBy('distance', 'ASC')
      .limit(3);

    const { entities, raw } = await query.getRawAndEntities();

    // Map the distance back so the client gets it
    return entities.map((entity, index) => {
      return {
        ...entity,
        distance: raw[index].distance
      };
    });
  }
}
