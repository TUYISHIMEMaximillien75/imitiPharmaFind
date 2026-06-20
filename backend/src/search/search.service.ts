import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pharmacy } from '../pharmacies/entities/pharmacy.entity';
import { SearchRequestDto } from './dto/search-request.dto';
import { LocationService } from '../locations/location.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Pharmacy)
    private readonly pharmacyRepository: Repository<Pharmacy>,
    private readonly locationService: LocationService,
  ) {}

  async searchPharmacies(dto: SearchRequestDto): Promise<any[]> {
    let { medicineNames, latitude, longitude, locationNodeId, insuranceId } = dto;
    const currentHour = new Date().getHours();

    this.logger.log(
      `Searching for: [${medicineNames.join(', ')}] | locationNodeId: ${locationNodeId} | insuranceId: ${insuranceId ?? 'none'}`,
    );

    if (!medicineNames || medicineNames.length === 0) {
      return [];
    }

    if (locationNodeId) {
      const node = await this.locationService.getNodeById(locationNodeId);
      if (node?.latitude && node?.longitude) {
        latitude = node.latitude;
        longitude = node.longitude;
        this.logger.log(`Resolved location "${node.name}" to (${latitude}, ${longitude})`);
      } else if (node) {
        this.logger.warn(`Location node "${node.name}" has no coordinates — searching with parent or default coords`);
        // Try to walk up the hierarchy to find a parent with coordinates
        const allNodes = await this.locationService.getAllNodes();
        const findWithCoords = (id: string): any => {
          const n = allNodes.find(x => x.id === id);
          if (!n) return null;
          if (n.latitude && n.longitude) return n;
          const parent = allNodes.find(x => x.children?.some((c: any) => c.id === n.id));
          return parent ? findWithCoords(parent.id) : null;
        };
        const ancestor = findWithCoords(locationNodeId);
        if (ancestor) {
          latitude = ancestor.latitude;
          longitude = ancestor.longitude;
          this.logger.log(`Using ancestor "${ancestor.name}" coords (${latitude}, ${longitude})`);
        }
      }
    }

    // Fallback if still no lat/long
    latitude = latitude ?? -1.5020; // Default Musanze lat
    longitude = longitude ?? 29.6350; // Default Musanze lng

    // When insurance filter is active we must INNER JOIN so only pharmacies
    // that actually accept that insurance are returned.
    const query = this.pharmacyRepository.createQueryBuilder('pharmacy')
      .innerJoin('pharmacy.inventory', 'inventory', 'inventory.stock > 0')
      .innerJoin('inventory.medicine', 'medicine')
      .where(
        medicineNames
          .map((_, i) => `medicine.name ILIKE :med${i}`)
          .join(' OR '),
        Object.fromEntries(medicineNames.map((n, i) => [`med${i}`, `%${n}%`])),
      )
      .andWhere('inventory.stock > 0')
      .andWhere('pharmacy.status = :status', { status: 'ACTIVE' });

    // Optional insurance filter — use INNER JOIN only when filtering
    if (insuranceId) {
      query
        .innerJoin('pharmacy.pharmacyInsurances', 'pi')
        .innerJoin('pi.insurance', 'insurance')
        .andWhere('insurance.id = :insuranceId', { insuranceId });
    } else {
      // Still load insurance data for display, but don't filter by it
      query
        .leftJoin('pharmacy.pharmacyInsurances', 'pi')
        .leftJoin('pi.insurance', 'insurance');
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
      .limit(10);

    const { entities, raw } = await query.getRawAndEntities();

    this.logger.log(`Found ${entities.length} matching pharmacies`);

    // Enrich each result with matched medicine details, insurance coverage, and distance
    const enriched = await Promise.all(
      entities.map(async (pharmacy, idx) => {
        // Reload inventory with medicine details and pharmacy insurances
        const detail = await this.pharmacyRepository
          .createQueryBuilder('p')
          .leftJoinAndSelect('p.inventory', 'inv')
          .leftJoinAndSelect('inv.medicine', 'med')
          .leftJoinAndSelect('p.pharmacyInsurances', 'pi')
          .leftJoinAndSelect('pi.insurance', 'ins')
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
            imageUrl: (inv.medicine as any)?.imageUrl ?? null,
          }));

        // Map pharmacyInsurances for the result
        const insurances = (detail?.pharmacyInsurances ?? []).map((pi) => ({
          id: pi.insurance?.id,
          providerName: pi.insurance?.providerName,
          coveragePercentage: Number(pi.coveragePercentage ?? pi.insurance?.defaultCoveragePercentage ?? 0),
        }));

        let matchingInsurance: any = null;
        if (insuranceId) {
          matchingInsurance = insurances.find(i => i.id === insuranceId) || null;
        }

        const availableMedsWithPricing = availableMeds.map((m) => {
          let insurancePays = 0;
          if (matchingInsurance) {
             insurancePays = (m.price * matchingInsurance.coveragePercentage) / 100;
          }
          return {
             ...m,
             insurancePays,
             patientPays: m.price - insurancePays,
             coveragePercentage: matchingInsurance?.coveragePercentage ?? 0,
          };
        });

        const totalPrice = availableMedsWithPricing.reduce((sum, m) => sum + Number(m.patientPays), 0);
        
        const h = new Date().getHours();
        const isOpen =
          pharmacy.openingTime <= pharmacy.closingTime
            ? h >= pharmacy.openingTime && h < pharmacy.closingTime
            : h >= pharmacy.openingTime || h < pharmacy.closingTime;

        return {
          ...pharmacy,
          distance: raw[idx]?.distance ?? null,
          availableMeds: availableMedsWithPricing,
          totalPrice,
          isOpen,
          insurances,
        };
      }),
    );

    return enriched.sort((a, b) => {
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    });
  }
}
