import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './users/entities/user.entity';
import { Pharmacy, PharmacyStatus } from './pharmacies/entities/pharmacy.entity';
import { PharmacyInsurance } from './pharmacies/entities/pharmacy-insurance.entity';
import { Insurance } from './insurances/entities/insurance.entity';
import { Medicine, MedicineCategory } from './medicines/entities/medicine.entity';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { Reservation, ReservationStatus, PaymentStatus } from './reservations/entities/reservation.entity';
import { ReservationItem } from './reservations/entities/reservation-item.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Clearing database...');
  await dataSource.query(`TRUNCATE TABLE "pharmacy_insurance" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "reservation_items" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "reservations" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "inventory_items" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "medicines" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "pharmacies" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "insurances" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "users" CASCADE`);

  console.log('Database cleared. Seeding initial data...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Seed Insurances (Issue #5 — Mutuelle de Santé added)
  const insuranceRepo = dataSource.getRepository(Insurance);
  const insurances = await insuranceRepo.save([
    { providerName: 'RAMA', defaultCoveragePercentage: 85.00 },
    { providerName: 'MMI', defaultCoveragePercentage: 85.00 },
    { providerName: 'CBHI (Mutuelle de Santé)', defaultCoveragePercentage: 90.00 },
    { providerName: 'UAP Insurance', defaultCoveragePercentage: 100.00 },
    { providerName: 'Radiant Insurance', defaultCoveragePercentage: 80.00 },
  ]);
  console.log(`Seeded ${insurances.length} insurances.`);

  // 2. Seed Users
  const userRepo = dataSource.getRepository(User);
  const usersToCreate = [
    { email: 'admin@belyse.com', passwordHash, firstName: 'System', lastName: 'Admin', role: UserRole.ADMIN, phone: '0780000000' },
    { email: 'pharmacist.volcans@belyse.com', passwordHash, firstName: 'Jean', lastName: 'Damascene', role: UserRole.PHARMACIST, phone: '0780000001' },
    { email: 'pharmacist.muhoza@belyse.com', passwordHash, firstName: 'Marie', lastName: 'Claire', role: UserRole.PHARMACIST, phone: '0780000002' },
    { email: 'pharmacist.kinigi@belyse.com', passwordHash, firstName: 'Eric', lastName: 'Manzi', role: UserRole.PHARMACIST, phone: '0780000003' },
    { email: 'patient1@belyse.com', passwordHash, firstName: 'Alice', lastName: 'Uwase', role: UserRole.PATIENT, phone: '0780000004' },
    { email: 'patient2@belyse.com', passwordHash, firstName: 'Bob', lastName: 'Ntwari', role: UserRole.PATIENT, phone: '0780000005' },
    { email: 'tuyishimemaximillien@gmail.com', passwordHash, firstName: 'Maximillien', lastName: 'TUYISHIME', role: UserRole.PATIENT, phone: '0784321588' },
    { email: 'patient3@belyse.com', passwordHash, firstName: 'Chantal', lastName: 'Mugisha', role: UserRole.PATIENT, phone: '0780000006' },
  ];
  const users = await userRepo.save(usersToCreate);
  console.log(`Seeded ${users.length} users.`);

  const pharmacists = users.filter(u => u.role === UserRole.PHARMACIST);
  const patients = users.filter(u => u.role === UserRole.PATIENT);

  // 3. Seed Pharmacies
  const pharmacyRepo = dataSource.getRepository(Pharmacy);
  const musanzeLocation = (sector: string, cell: string, lat: number, lng: number) => ({
    province: 'Northern Province',
    district: 'Musanze',
    sector,
    cell,
    latitude: lat,
    longitude: lng,
  });

  const pharmaciesToCreate: DeepPartial<Pharmacy>[] = [
    {
      name: 'Pharmacie des Volcans',
      licenseNumber: 'LIC-MUS-001',
      address: 'Musanze City Center, Near Market',
      phone: '0781111111',
      description: 'A trusted pharmacy in the heart of Musanze, providing services and a wide range of medical supplies.',
      openingTime: 7,
      closingTime: 22,
      location: musanzeLocation('Muhoza', 'Mpenge', -1.5020, 29.6350),
      status: PharmacyStatus.ACTIVE,
      isActive: true,
      owner: pharmacists[0],
    },
    {
      name: 'Pharmacie Muhoza',
      licenseNumber: 'LIC-MUS-002',
      address: 'Near Ruhengeri Hospital',
      phone: '0782222222',
      description: 'Your reliable neighborhood pharmacy offering quality medicines and health advice.',
      openingTime: 8,
      closingTime: 20,
      location: musanzeLocation('Muhoza', 'Ruhengeri', -1.4985, 29.6380),
      status: PharmacyStatus.ACTIVE,
      isActive: true,
      owner: pharmacists[1],
    },
    {
      name: 'Kinigi Health Pharmacy',
      licenseNumber: 'LIC-MUS-003',
      address: 'Kinigi Sector, Near Volcanoes National Park',
      phone: '0783333333',
      description: 'Providing essential medicines and first aid supplies for locals and tourists in Kinigi.',
      openingTime: 8,
      closingTime: 18,
      location: musanzeLocation('Kinigi', 'Bisate', -1.4350, 29.5850),
      status: PharmacyStatus.ACTIVE,
      isActive: true,
      owner: pharmacists[2],
    },
  ];

  const pharmacies = await pharmacyRepo.save(pharmaciesToCreate);
  console.log(`Seeded ${pharmacies.length} pharmacies in Musanze.`);

  // 3b. Seed PharmacyInsurance pivot records (with coverage %)
  const piRepo = dataSource.getRepository(PharmacyInsurance);
  const piRecords: DeepPartial<PharmacyInsurance>[] = [
    // Volcans: RAMA 85%, MMI 85%, CBHI 90%
    { pharmacyId: pharmacies[0].id, insuranceId: insurances[0].id, coveragePercentage: 85 },
    { pharmacyId: pharmacies[0].id, insuranceId: insurances[1].id, coveragePercentage: 85 },
    { pharmacyId: pharmacies[0].id, insuranceId: insurances[2].id, coveragePercentage: 90 },
    // Muhoza: CBHI 90%, UAP 100%
    { pharmacyId: pharmacies[1].id, insuranceId: insurances[2].id, coveragePercentage: 90 },
    { pharmacyId: pharmacies[1].id, insuranceId: insurances[3].id, coveragePercentage: 100 },
    // Kinigi: RAMA 80%, Radiant 75%
    { pharmacyId: pharmacies[2].id, insuranceId: insurances[0].id, coveragePercentage: 80 },
    { pharmacyId: pharmacies[2].id, insuranceId: insurances[4].id, coveragePercentage: 75 },
  ];
  await piRepo.save(piRecords);
  console.log(`Seeded ${piRecords.length} pharmacy-insurance links.`);

  // 4. Seed Medicines with imageUrl (Issue #9)
  const medicineRepo = dataSource.getRepository(Medicine);
  const medicinesToCreate = [
    {
      name: 'Paracetamol 500mg',
      category: MedicineCategory.PAINKILLER,
      description: 'Used to treat mild to moderate pain and reduce fever.',
      requiresPrescription: false,
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80',
    },
    {
      name: 'Ibuprofen 400mg',
      category: MedicineCategory.PAINKILLER,
      description: 'Nonsteroidal anti-inflammatory drug for pain relief and fever.',
      requiresPrescription: false,
      imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=200&q=80',
    },
    {
      name: 'Amoxicillin 500mg',
      category: MedicineCategory.ANTIBIOTIC,
      description: 'Penicillin antibiotic used to treat various bacterial infections.',
      requiresPrescription: true,
      imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&q=80',
    },
    {
      name: 'Ciprofloxacin 500mg',
      category: MedicineCategory.ANTIBIOTIC,
      description: 'Fluoroquinolone antibiotic for bacterial infections.',
      requiresPrescription: true,
      imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&q=80',
    },
    {
      name: 'Omeprazole 20mg',
      category: MedicineCategory.GASTROINTESTINAL,
      description: 'Proton pump inhibitor for GERD treatment.',
      requiresPrescription: true,
      imageUrl: 'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=200&q=80',
    },
    {
      name: 'Cetirizine 10mg',
      category: MedicineCategory.OTHER,
      description: 'Antihistamine used to relieve allergy symptoms.',
      requiresPrescription: false,
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&q=80',
    },
    {
      name: 'Vitamin C 1000mg',
      category: MedicineCategory.VITAMIN,
      description: 'Essential vitamin for immune system support.',
      requiresPrescription: false,
      imageUrl: 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=200&q=80',
    },
    {
      name: 'Metformin 500mg',
      category: MedicineCategory.DIABETIC,
      description: 'Medication used to treat type 2 diabetes.',
      requiresPrescription: true,
      imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=200&q=80',
    },
    {
      name: 'Amlodipine 5mg',
      category: MedicineCategory.CARDIOVASCULAR,
      description: 'Calcium channel blocker for high blood pressure.',
      requiresPrescription: true,
      imageUrl: 'https://images.unsplash.com/photo-1578496479531-32e296d5c6e1?w=200&q=80',
    },
    {
      name: 'Fluconazole 150mg',
      category: MedicineCategory.ANTIFUNGAL,
      description: 'Antifungal medication for fungal infections.',
      requiresPrescription: true,
      imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&q=80',
    },
  ];
  const medicines = await medicineRepo.save(medicinesToCreate);
  console.log(`Seeded ${medicines.length} medicines.`);

  // 5. Seed Inventory Items
  const inventoryRepo = dataSource.getRepository(InventoryItem);
  const inventoryItemsToCreate: DeepPartial<InventoryItem>[] = [];

  for (const pharmacy of pharmacies) {
    for (const medicine of medicines) {
      const basePrice = Math.floor(Math.random() * 4500) + 500;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6 + Math.floor(Math.random() * 18));

      inventoryItemsToCreate.push({
        stock: Math.floor(Math.random() * 100) + 10,
        price: basePrice,
        lowStockThreshold: Math.floor(Math.random() * 15) + 5,
        expiryDate,
        pharmacy,
        medicine,
      });
    }
  }
  const inventoryItems = await inventoryRepo.save(inventoryItemsToCreate);
  console.log(`Seeded ${inventoryItems.length} inventory items.`);

  // 6. Seed Reservations
  const reservationRepo = dataSource.getRepository(Reservation);
  const reservationsToCreate: DeepPartial<Reservation>[] = [];

  for (let i = 0; i < 5; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const pharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)];
    const availableItems = inventoryItems.filter(item => item.pharmacy.id === pharmacy.id);
    if (availableItems.length === 0) continue;

    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: DeepPartial<ReservationItem>[] = [];
    let totalAmount = 0;

    const shuffledItems = [...availableItems].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, numItems);

    for (const item of selectedItems) {
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({
        medicine: item.medicine,
        quantity,
        priceAtReservation: item.price,
      });
      totalAmount += (item.price * quantity);
    }

    const statuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    reservationsToCreate.push({
      patient,
      pharmacy,
      items,
      status,
      paymentStatus: status === ReservationStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      totalAmount,
      notes: `Sample reservation ${i + 1}`,
    });
  }

  const reservations = await reservationRepo.save(reservationsToCreate);
  console.log(`Seeded ${reservations.length} reservations.`);

  console.log('\n✅ Seeding complete!');
  console.log('─────────────────────────────────────');
  console.log('Admin:       admin@belyse.com / 123456');
  console.log('Pharmacist1: pharmacist.volcans@belyse.com / 123456');
  console.log('Patient:     patient1@belyse.com / 123456');
  console.log('─────────────────────────────────────');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
