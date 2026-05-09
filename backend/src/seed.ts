import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './users/entities/user.entity';
import { Pharmacy, PharmacyStatus } from './pharmacies/entities/pharmacy.entity';
import { Insurance } from './insurances/entities/insurance.entity';
import { Medicine, MedicineCategory } from './medicines/entities/medicine.entity';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { Reservation, ReservationStatus, PaymentStatus } from './reservations/entities/reservation.entity';
import { ReservationItem } from './reservations/entities/reservation-item.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Clearing database...');
  // Using CASCADE to drop dependencies (join tables, etc)
  await dataSource.query(`TRUNCATE TABLE "users" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "pharmacies" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "insurances" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "medicines" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "inventory_items" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "reservations" CASCADE`);
  await dataSource.query(`TRUNCATE TABLE "reservation_items" CASCADE`);

  console.log('Database cleared. Seeding initial data...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Seed Insurances
  const insuranceRepo = dataSource.getRepository(Insurance);
  const insurances = await insuranceRepo.save([
    { providerName: 'RAMA', defaultCoveragePercentage: 85.00 },
    { providerName: 'MMI', defaultCoveragePercentage: 85.00 },
    { providerName: 'CBHI (Mutuelle de Santé)', defaultCoveragePercentage: 90.00 },
    { providerName: 'UAP Insurance', defaultCoveragePercentage: 100.00 },
    { providerName: 'Radiant', defaultCoveragePercentage: 80.00 },
  ]);
  console.log(`Seeded ${insurances.length} insurances.`);

  // 2. Seed Users
  const userRepo = dataSource.getRepository(User);
  const usersToCreate = [
    { email: 'admin@belyse.com', passwordHash, firstName: 'System', lastName: 'Admin', role: UserRole.ADMIN, phone: '0780000000' },
    
    // Pharmacists
    { email: 'pharmacist.volcans@belyse.com', passwordHash, firstName: 'Jean', lastName: 'Damascene', role: UserRole.PHARMACIST, phone: '0780000001' },
    { email: 'pharmacist.muhoza@belyse.com', passwordHash, firstName: 'Marie', lastName: 'Claire', role: UserRole.PHARMACIST, phone: '0780000002' },
    { email: 'pharmacist.kinigi@belyse.com', passwordHash, firstName: 'Eric', lastName: 'Manzi', role: UserRole.PHARMACIST, phone: '0780000003' },
    
    // Patients
    { email: 'patient1@belyse.com', passwordHash, firstName: 'Alice', lastName: 'Uwase', role: UserRole.PATIENT, phone: '0780000004' },
    { email: 'patient2@belyse.com', passwordHash, firstName: 'Bob', lastName: 'Ntwari', role: UserRole.PATIENT, phone: '0780000005' },
    { email: 'tuyishimemaximillien@gmail.com', passwordHash, firstName: 'Maximillien', lastName: 'TUYISHIME', role: UserRole.PATIENT, phone: '0784321588' },
    { email: 'patient3@belyse.com', passwordHash, firstName: 'Chantal', lastName: 'Mugisha', role: UserRole.PATIENT, phone: '0780000006' },
  ];
  const users = await userRepo.save(usersToCreate);
  console.log(`Seeded ${users.length} users.`);

  const pharmacists = users.filter(u => u.role === UserRole.PHARMACIST);
  const patients = users.filter(u => u.role === UserRole.PATIENT);

  // 3. Seed Pharmacies (in Musanze)
  const pharmacyRepo = dataSource.getRepository(Pharmacy);
  const musanzeLocation = (sector: string, cell: string, lat: number, lng: number) => ({
    province: 'Northern Province',
    district: 'Musanze',
    sector,
    cell,
    latitude: lat,
    longitude: lng,
  });

  const pharmaciesToCreate = [
    {
      name: 'Pharmacie des Volcans',
      licenseNumber: 'LIC-MUS-001',
      address: 'Musanze City Center, Near Market',
      phone: '0781111111',
      description: 'A trusted pharmacy in the heart of Musanze, providing 24/7 services and a wide range of medical supplies.',
      openingTime: 7,
      closingTime: 22,
      location: musanzeLocation('Muhoza', 'Mpenge', -1.5020, 29.6350),
      status: PharmacyStatus.ACTIVE,
      isActive: true,
      owner: pharmacists[0],
      insurances: [insurances[0], insurances[1], insurances[2]] // RAMA, MMI, CBHI
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
      insurances: [insurances[2], insurances[3]] // CBHI, UAP
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
      insurances: [insurances[0], insurances[4]] // RAMA, Radiant
    }
  ];
  
  const pharmacies = await pharmacyRepo.save(pharmaciesToCreate);
  console.log(`Seeded ${pharmacies.length} pharmacies in Musanze.`);

  // 4. Seed Medicines
  const medicineRepo = dataSource.getRepository(Medicine);
  const medicinesToCreate = [
    { name: 'Paracetamol 500mg', category: MedicineCategory.PAINKILLER, description: 'Used to treat mild to moderate pain and reduce fever.', requiresPrescription: false },
    { name: 'Ibuprofen 400mg', category: MedicineCategory.PAINKILLER, description: 'Nonsteroidal anti-inflammatory drug used for pain relief and fever reduction.', requiresPrescription: false },
    { name: 'Amoxicillin 500mg', category: MedicineCategory.ANTIBIOTIC, description: 'Penicillin antibiotic used to treat various bacterial infections.', requiresPrescription: true },
    { name: 'Ciprofloxacin 500mg', category: MedicineCategory.ANTIBIOTIC, description: 'Fluoroquinolone antibiotic used to treat different types of bacterial infections.', requiresPrescription: true },
    { name: 'Omeprazole 20mg', category: MedicineCategory.GASTROINTESTINAL, description: 'Proton pump inhibitor used to treat gastroesophageal reflux disease (GERD).', requiresPrescription: true },
    { name: 'Cetirizine 10mg', category: MedicineCategory.OTHER, description: 'Antihistamine used to relieve allergy symptoms.', requiresPrescription: false },
    { name: 'Vitamin C 1000mg', category: MedicineCategory.VITAMIN, description: 'Essential vitamin for immune system support.', requiresPrescription: false },
    { name: 'Metformin 500mg', category: MedicineCategory.DIABETIC, description: 'Medication used to treat type 2 diabetes.', requiresPrescription: true },
    { name: 'Amlodipine 5mg', category: MedicineCategory.CARDIOVASCULAR, description: 'Calcium channel blocker used to treat high blood pressure.', requiresPrescription: true },
    { name: 'Fluconazole 150mg', category: MedicineCategory.ANTIFUNGAL, description: 'Antifungal medication used to treat a variety of fungal infections.', requiresPrescription: true },
  ];
  const medicines = await medicineRepo.save(medicinesToCreate);
  console.log(`Seeded ${medicines.length} medicines.`);

  // 5. Seed Inventory Items
  const inventoryRepo = dataSource.getRepository(InventoryItem);
  const inventoryItemsToCreate: DeepPartial<InventoryItem>[] = [];

  // Assign medicines to pharmacies with random stock and price
  for (const pharmacy of pharmacies) {
    // Give all medicines to all pharmacies for reliable testing
    const selectedMedicines = medicines;

    for (const medicine of selectedMedicines) {
      // Base price in RWF
      const basePrice = Math.floor(Math.random() * 4500) + 500; 
      
      // Expiry date between 6 months and 2 years from now
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6 + Math.floor(Math.random() * 18));

      inventoryItemsToCreate.push({
        stock: Math.floor(Math.random() * 100) + 10,
        price: basePrice,
        lowStockThreshold: Math.floor(Math.random() * 15) + 5,
        expiryDate,
        pharmacy,
        medicine
      });
    }
  }
  const inventoryItems = await inventoryRepo.save(inventoryItemsToCreate);
  console.log(`Seeded ${inventoryItems.length} inventory items.`);

  // 6. Seed Reservations
  const reservationRepo = dataSource.getRepository(Reservation);
  const reservationsToCreate: DeepPartial<Reservation>[] = [];

  // Create 5 sample reservations
  for (let i = 0; i < 5; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const pharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)];
    
    // Find items available in this pharmacy
    const availableItems = inventoryItems.filter(item => item.pharmacy.id === pharmacy.id);
    if (availableItems.length === 0) continue;

    // Pick 1-3 random items for the reservation
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
        priceAtReservation: item.price
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
      notes: `Sample reservation ${i + 1}`
    });
  }

  const reservations = await reservationRepo.save(reservationsToCreate);
  console.log(`Seeded ${reservations.length} reservations.`);

  console.log('Seeding complete!');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
