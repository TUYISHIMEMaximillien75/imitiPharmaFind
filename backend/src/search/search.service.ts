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

    this.logger.log(
      `Searching for: [${medicineNames.join(', ')}] | insuranceId: ${insuranceId ?? 'none'} | hour: ${currentHour}`,
    );

    if (!medicineNames || medicineNames.length === 0) {
      return [];
    }

    // Build ILIKE conditions for case-insensitive partial name matching
    // e.g. "amlodipine 5mg" will match "Amlodipine 5mg" in the DB
    const query = this.pharmacyRepository.createQueryBuilder('pharmacy')
      // --- Insurance: optional filter (LEFT JOIN + conditional WHERE) ---
      .leftJoin('pharmacy.insurances', 'insurance')
      .innerJoin('pharmacy.inventory', 'inventory', 'inventory.stock > 0')
      .innerJoin('inventory.medicine', 'medicine')
      .where(
        // At least one of the searched names matches (case-insensitive) for each inventory row
        medicineNames
          .map((_, i) => `medicine.name ILIKE :med${i}`)
          .join(' OR '),
        Object.fromEntries(medicineNames.map((n, i) => [`med${i}`, `%${n}%`])),
      )
      .andWhere('inventory.stock > 0')
      .andWhere('pharmacy.status = :status', { status: 'ACTIVE' });


    // Optional insurance filter
    if (insuranceId) {
      query.andWhere('insurance.id = :insuranceId', { insuranceId });
    }

    // Distance column (Haversine)
    query
      .addSelect(
        `(6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(:latitude)) * cos(radians("pharmacy"."locationLatitude"))
              * cos(radians("pharmacy"."locationLongitude") - radians(:longitude))
              + sin(radians(:latitude)) * sin(radians("pharmacy"."locationLatitude"))
            ))
          ))`,
        'distance',
      )
      .setParameters({ latitude, longitude })
      .groupBy('pharmacy.id')
      .orderBy('distance', 'ASC')
      .limit(3);

    const { entities, raw } = await query.getRawAndEntities();

    this.logger.log(`Found ${entities.length} matching pharmacies`);

    // Enrich each result with matched medicine details and distance
    const enriched = await Promise.all(
      entities.map(async (pharmacy, idx) => {
        // Reload inventory with medicine details for this pharmacy
        const detail = await this.pharmacyRepository
          .createQueryBuilder('p')
          .leftJoinAndSelect('p.inventory', 'inv')
          .leftJoinAndSelect('inv.medicine', 'med')
          .where('p.id = :id', { id: pharmacy.id })
          .getOne();

        const availableMeds = (detail?.inventory ?? [])
          .filter((inv) => {
            if (inv.stock <= 0) return false;
            return medicineNames.some((n) =>
              inv.medicine?.name?.toLowerCase().includes(n.toLowerCase()),
            );
          })
          .map((inv) => ({
            medicineId: inv.medicineId,
            name: inv.medicine?.name,
            price: inv.price,
            stock: inv.stock,
          }));

        const totalPrice = availableMeds.reduce((sum, m) => sum + Number(m.price), 0);
        const h = new Date().getHours();
        const isOpen =
          pharmacy.openingTime <= pharmacy.closingTime
            ? h >= pharmacy.openingTime && h < pharmacy.closingTime
            : h >= pharmacy.openingTime || h < pharmacy.closingTime;

        return {
          ...pharmacy,
          distance: raw[idx]?.distance ?? null,
          availableMeds,
          totalPrice,
          isOpen,
        };
      }),
    );

    return enriched.sort((a, b) => {
      // Open pharmacies always appear first
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      // Within same open/closed group, sort by distance
      return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    });
  }
}
