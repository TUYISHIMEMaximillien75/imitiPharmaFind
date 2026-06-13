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
import { Reservation, ReservationStatus, PaymentStatus, PaymentMethod, DeliveryOption, DeliveryStatus } from './reservations/entities/reservation.entity';
import { ReservationItem } from './reservations/entities/reservation-item.entity';
import { LocationNode, LocationType } from './locations/entities/location-node.entity';

// ─── Rwanda Administrative Hierarchy ───────────────────────────────────────
// 5 Provinces → 30 Districts → 416 Sectors (with approximate coordinates)

const RWANDA = [
  {
    name: 'Kigali City', lat: -1.9441, lng: 30.0619,
    districts: [
      { name: 'Gasabo', lat: -1.8899, lng: 30.1078, sectors: [
        { name: 'Bumbogo', lat: -1.8536, lng: 30.1247 }, { name: 'Gatsata', lat: -1.9106, lng: 30.0858 },
        { name: 'Gikomero', lat: -1.8403, lng: 30.1567 }, { name: 'Gisozi', lat: -1.9044, lng: 30.0942 },
        { name: 'Jabana', lat: -1.8617, lng: 30.1369 }, { name: 'Jali', lat: -1.8750, lng: 30.1653 },
        { name: 'Kacyiru', lat: -1.9333, lng: 30.0833 }, { name: 'Kimihurura', lat: -1.9444, lng: 30.0972 },
        { name: 'Kimironko', lat: -1.9403, lng: 30.1078 }, { name: 'Kinyinya', lat: -1.9153, lng: 30.1189 },
        { name: 'Ndera', lat: -1.8906, lng: 30.1856 }, { name: 'Nduba', lat: -1.8422, lng: 30.0756 },
        { name: 'Remera', lat: -1.9522, lng: 30.1094 }, { name: 'Rusororo', lat: -1.8336, lng: 30.1894 },
        { name: 'Rutunga', lat: -1.8208, lng: 30.1203 },
      ]},
      { name: 'Kicukiro', lat: -1.9867, lng: 30.1039, sectors: [
        { name: 'Gahanga', lat: -2.0250, lng: 30.1119 }, { name: 'Gatenga', lat: -1.9933, lng: 30.0967 },
        { name: 'Gikondo', lat: -1.9769, lng: 30.0869 }, { name: 'Kagarama', lat: -1.9736, lng: 30.1178 },
        { name: 'Kanombe', lat: -1.9739, lng: 30.1350 }, { name: 'Kicukiro', lat: -1.9878, lng: 30.0906 },
        { name: 'Kigarama', lat: -2.0011, lng: 30.1256 }, { name: 'Masaka', lat: -2.0361, lng: 30.0747 },
        { name: 'Niboye', lat: -2.0083, lng: 30.0811 }, { name: 'Nyarugunga', lat: -1.9831, lng: 30.1017 },
      ]},
      { name: 'Nyarugenge', lat: -1.9455, lng: 30.0558, sectors: [
        { name: 'Gitega', lat: -1.9528, lng: 30.0603 }, { name: 'Kanyinya', lat: -1.9694, lng: 30.0344 },
        { name: 'Kigali', lat: -1.9536, lng: 30.0606 }, { name: 'Kimisagara', lat: -1.9617, lng: 30.0539 },
        { name: 'Mageragere', lat: -2.0083, lng: 29.9817 }, { name: 'Muhima', lat: -1.9539, lng: 30.0556 },
        { name: 'Nyakabanda', lat: -1.9628, lng: 30.0489 }, { name: 'Nyamirambo', lat: -1.9733, lng: 30.0467 },
        { name: 'Nyarugenge', lat: -1.9539, lng: 30.0583 }, { name: 'Rwezamenyo', lat: -1.9606, lng: 30.0617 },
      ]},
    ],
  },
  {
    name: 'Northern Province', lat: -1.5000, lng: 29.7500,
    districts: [
      { name: 'Burera', lat: -1.3623, lng: 29.8366, sectors: [
        { name: 'Bungwe', lat: -1.2761, lng: 29.8494 }, { name: 'Butaro', lat: -1.2972, lng: 29.8419 },
        { name: 'Cyanika', lat: -1.3406, lng: 29.7536 }, { name: 'Cyeru', lat: -1.3006, lng: 29.8839 },
        { name: 'Gahunga', lat: -1.3728, lng: 29.7939 }, { name: 'Gatebe', lat: -1.3556, lng: 29.8889 },
        { name: 'Gitovu', lat: -1.4022, lng: 29.8994 }, { name: 'Kagogo', lat: -1.3189, lng: 29.9228 },
        { name: 'Kinoni', lat: -1.3956, lng: 29.8211 }, { name: 'Kinyababa', lat: -1.3444, lng: 29.8722 },
        { name: 'Kivuye', lat: -1.3739, lng: 29.9228 }, { name: 'Nemba', lat: -1.4239, lng: 29.8694 },
        { name: 'Rugarama', lat: -1.3594, lng: 29.8239 }, { name: 'Rugendabari', lat: -1.4033, lng: 29.7617 },
        { name: 'Ruhunde', lat: -1.4361, lng: 29.8478 }, { name: 'Rusarabuye', lat: -1.4039, lng: 29.8056 },
        { name: 'Rwerere', lat: -1.3272, lng: 29.7806 },
      ]},
      { name: 'Gakenke', lat: -1.6865, lng: 29.7855, sectors: [
        { name: 'Busengo', lat: -1.6350, lng: 29.7733 }, { name: 'Coko', lat: -1.7067, lng: 29.8044 },
        { name: 'Cyabingo', lat: -1.6511, lng: 29.8178 }, { name: 'Gakenke', lat: -1.7022, lng: 29.7772 },
        { name: 'Gashenyi', lat: -1.7256, lng: 29.7506 }, { name: 'Janja', lat: -1.6656, lng: 29.7294 },
        { name: 'Kamubuga', lat: -1.7400, lng: 29.8133 }, { name: 'Karama', lat: -1.6978, lng: 29.7400 },
        { name: 'Kivuruga', lat: -1.6506, lng: 29.8028 }, { name: 'Mataba', lat: -1.7178, lng: 29.7189 },
        { name: 'Minazi', lat: -1.6511, lng: 29.7478 }, { name: 'Muhondo', lat: -1.7294, lng: 29.8344 },
        { name: 'Muyongwe', lat: -1.6783, lng: 29.8344 }, { name: 'Muzo', lat: -1.7444, lng: 29.7222 },
        { name: 'Nemba', lat: -1.6544, lng: 29.7856 }, { name: 'Ruli', lat: -1.7233, lng: 29.7694 },
        { name: 'Rusasa', lat: -1.6833, lng: 29.8167 }, { name: 'Rushashi', lat: -1.7094, lng: 29.8678 },
      ]},
      { name: 'Gicumbi', lat: -1.5773, lng: 30.0794, sectors: [
        { name: 'Bukure', lat: -1.5406, lng: 30.1344 }, { name: 'Bwisige', lat: -1.5028, lng: 30.1756 },
        { name: 'Byumba', lat: -1.5756, lng: 30.0678 }, { name: 'Cyumba', lat: -1.4728, lng: 30.1511 },
        { name: 'Giti', lat: -1.5856, lng: 30.1244 }, { name: 'Kaniga', lat: -1.5256, lng: 30.0511 },
        { name: 'Manyagiro', lat: -1.6078, lng: 30.0311 }, { name: 'Miyove', lat: -1.5378, lng: 29.9994 },
        { name: 'Muko', lat: -1.6283, lng: 30.0978 }, { name: 'Mutete', lat: -1.5578, lng: 30.0878 },
        { name: 'Nyamiyaga', lat: -1.6283, lng: 30.0178 }, { name: 'Nyankenke', lat: -1.5078, lng: 30.0311 },
        { name: 'Rubaya', lat: -1.5378, lng: 30.0178 }, { name: 'Rugarama', lat: -1.5978, lng: 30.1044 },
        { name: 'Rukomo', lat: -1.5678, lng: 30.1511 }, { name: 'Rushaki', lat: -1.5678, lng: 29.9678 },
        { name: 'Rutare', lat: -1.6328, lng: 30.1344 }, { name: 'Ruvune', lat: -1.4811, lng: 30.0978 },
        { name: 'Rwamiko', lat: -1.5228, lng: 30.1011 }, { name: 'Shangasha', lat: -1.6028, lng: 29.9978 },
      ]},
      { name: 'Musanze', lat: -1.5020, lng: 29.6350, sectors: [
        { name: 'Busogo', lat: -1.5578, lng: 29.6078 }, { name: 'Cyuve', lat: -1.4711, lng: 29.6511 },
        { name: 'Gacaca', lat: -1.5278, lng: 29.6678 }, { name: 'Gashaki', lat: -1.4811, lng: 29.6978 },
        { name: 'Gataraga', lat: -1.5478, lng: 29.6411 }, { name: 'Kimonyi', lat: -1.5178, lng: 29.6211 },
        { name: 'Kinigi', lat: -1.4378, lng: 29.5944 }, { name: 'Muhoza', lat: -1.4978, lng: 29.6344 },
        { name: 'Musanze', lat: -1.4978, lng: 29.6311 }, { name: 'Nkotsi', lat: -1.5511, lng: 29.6811 },
        { name: 'Nyange', lat: -1.5711, lng: 29.5778 }, { name: 'Remera', lat: -1.5278, lng: 29.5811 },
        { name: 'Rwaza', lat: -1.4611, lng: 29.6078 }, { name: 'Shingiro', lat: -1.5811, lng: 29.6511 },
      ]},
      { name: 'Rulindo', lat: -1.7395, lng: 29.9855, sectors: [
        { name: 'Base', lat: -1.7244, lng: 30.0378 }, { name: 'Burega', lat: -1.7578, lng: 30.0178 },
        { name: 'Bushoki', lat: -1.7978, lng: 30.0078 }, { name: 'Buyoga', lat: -1.7478, lng: 29.9411 },
        { name: 'Cyinzuzi', lat: -1.7278, lng: 29.9611 }, { name: 'Cyungo', lat: -1.7778, lng: 29.9611 },
        { name: 'Kinihira', lat: -1.6978, lng: 30.0011 }, { name: 'Kisaro', lat: -1.7478, lng: 30.0678 },
        { name: 'Masoro', lat: -1.8278, lng: 29.9811 }, { name: 'Mbogo', lat: -1.8578, lng: 30.0278 },
        { name: 'Murambi', lat: -1.7778, lng: 30.0478 }, { name: 'Ngoma', lat: -1.6778, lng: 29.9811 },
        { name: 'Ntarabana', lat: -1.8078, lng: 29.9411 }, { name: 'Rukozo', lat: -1.8078, lng: 30.0611 },
        { name: 'Rusiga', lat: -1.6778, lng: 30.0411 }, { name: 'Shyorongi', lat: -1.8378, lng: 30.0178 },
        { name: 'Tumba', lat: -1.7178, lng: 29.9811 },
      ]},
    ],
  },
  {
    name: 'Southern Province', lat: -2.3498, lng: 29.7387,
    districts: [
      { name: 'Gisagara', lat: -2.5974, lng: 29.8356, sectors: [
        { name: 'Gikonko', lat: -2.5644, lng: 29.8544 }, { name: 'Gishubi', lat: -2.5844, lng: 29.8344 },
        { name: 'Kansi', lat: -2.5344, lng: 29.8144 }, { name: 'Kibilizi', lat: -2.6244, lng: 29.8244 },
        { name: 'Kigembe', lat: -2.6644, lng: 29.8544 }, { name: 'Mamba', lat: -2.6144, lng: 29.7944 },
        { name: 'Muganza', lat: -2.5444, lng: 29.8544 }, { name: 'Mugombwa', lat: -2.5744, lng: 29.7744 },
        { name: 'Mukindo', lat: -2.6044, lng: 29.8644 }, { name: 'Musha', lat: -2.5244, lng: 29.8744 },
        { name: 'Ndora', lat: -2.5544, lng: 29.8044 }, { name: 'Nyanza', lat: -2.6344, lng: 29.7544 },
        { name: 'Save', lat: -2.5944, lng: 29.8744 },
      ]},
      { name: 'Huye', lat: -2.5989, lng: 29.7364, sectors: [
        { name: 'Gishamvu', lat: -2.5644, lng: 29.7244 }, { name: 'Karama', lat: -2.5844, lng: 29.7644 },
        { name: 'Kigoma', lat: -2.6144, lng: 29.7044 }, { name: 'Kinazi', lat: -2.5444, lng: 29.7444 },
        { name: 'Maraba', lat: -2.6344, lng: 29.7244 }, { name: 'Mbazi', lat: -2.5744, lng: 29.7644 },
        { name: 'Mukura', lat: -2.5244, lng: 29.7844 }, { name: 'Ngoma', lat: -2.5544, lng: 29.7044 },
        { name: 'Ruhashya', lat: -2.6044, lng: 29.7744 }, { name: 'Rusatira', lat: -2.6444, lng: 29.7844 },
        { name: 'Rwaniro', lat: -2.6244, lng: 29.7644 }, { name: 'Simbi', lat: -2.5344, lng: 29.7244 },
        { name: 'Tumba', lat: -2.6544, lng: 29.7444 },
      ]},
      { name: 'Kamonyi', lat: -2.0174, lng: 29.9286, sectors: [
        { name: 'Gacurabwenge', lat: -2.0144, lng: 29.9044 }, { name: 'Karama', lat: -1.9944, lng: 29.9344 },
        { name: 'Kayenzi', lat: -2.0344, lng: 29.9544 }, { name: 'Kayumbu', lat: -2.0544, lng: 29.9144 },
        { name: 'Mugina', lat: -1.9744, lng: 29.9244 }, { name: 'Musambira', lat: -2.0744, lng: 29.9444 },
        { name: 'Ngamba', lat: -1.9944, lng: 29.9544 }, { name: 'Nyamiyaga', lat: -2.0744, lng: 29.9044 },
        { name: 'Nyarubaka', lat: -2.0344, lng: 29.8744 }, { name: 'Rugarika', lat: -2.0144, lng: 29.9744 },
        { name: 'Rukoma', lat: -2.0544, lng: 29.8944 }, { name: 'Runda', lat: -1.9744, lng: 29.9044 },
        { name: 'Shyogwe', lat: -2.0144, lng: 29.9344 },
      ]},
      { name: 'Muhanga', lat: -2.0857, lng: 29.7467, sectors: [
        { name: 'Cyeza', lat: -2.0744, lng: 29.7144 }, { name: 'Kabacuzi', lat: -2.0544, lng: 29.7644 },
        { name: 'Kibangu', lat: -2.1044, lng: 29.7744 }, { name: 'Kiyumba', lat: -2.1244, lng: 29.7244 },
        { name: 'Muhanga', lat: -2.0844, lng: 29.7444 }, { name: 'Mushishiro', lat: -2.1444, lng: 29.7544 },
        { name: 'Nyabindu', lat: -2.0644, lng: 29.7344 }, { name: 'Nyamabuye', lat: -2.0944, lng: 29.7644 },
        { name: 'Nyamiyaga', lat: -2.1144, lng: 29.7144 }, { name: 'Rongi', lat: -2.0444, lng: 29.7244 },
        { name: 'Rugendabari', lat: -2.1344, lng: 29.7344 }, { name: 'Shyogwe', lat: -2.1044, lng: 29.7544 },
      ]},
      { name: 'Nyamagabe', lat: -2.4819, lng: 29.4821, sectors: [
        { name: 'Buruhukiro', lat: -2.4444, lng: 29.4644 }, { name: 'Cyanika', lat: -2.5044, lng: 29.5044 },
        { name: 'Gasaka', lat: -2.4844, lng: 29.4444 }, { name: 'Gatare', lat: -2.5244, lng: 29.4644 },
        { name: 'Kaduha', lat: -2.4644, lng: 29.5244 }, { name: 'Kamegeli', lat: -2.4244, lng: 29.4844 },
        { name: 'Kibumbwe', lat: -2.5444, lng: 29.4844 }, { name: 'Kitabi', lat: -2.4644, lng: 29.4244 },
        { name: 'Mbazi', lat: -2.4444, lng: 29.5044 }, { name: 'Mugano', lat: -2.5644, lng: 29.5044 },
        { name: 'Musange', lat: -2.5044, lng: 29.4244 }, { name: 'Musebeya', lat: -2.5844, lng: 29.4644 },
        { name: 'Mushubi', lat: -2.4044, lng: 29.4644 }, { name: 'Nkomane', lat: -2.5244, lng: 29.5244 },
        { name: 'Tare', lat: -2.4844, lng: 29.5444 }, { name: 'Uwinkingi', lat: -2.4244, lng: 29.5244 },
      ]},
      { name: 'Nyamasheke', lat: -2.3278, lng: 29.1256, sectors: [
        { name: 'Bushekeri', lat: -2.3644, lng: 29.1044 }, { name: 'Bushenge', lat: -2.3244, lng: 29.1444 },
        { name: 'Cyato', lat: -2.3844, lng: 29.1244 }, { name: 'Gihombo', lat: -2.2944, lng: 29.1044 },
        { name: 'Kagano', lat: -2.3444, lng: 29.0844 }, { name: 'Kanjongo', lat: -2.2744, lng: 29.1244 },
        { name: 'Karambi', lat: -2.3144, lng: 29.0644 }, { name: 'Karengera', lat: -2.3644, lng: 29.1644 },
        { name: 'Kirimbi', lat: -2.2544, lng: 29.1444 }, { name: 'Macuba', lat: -2.4044, lng: 29.1244 },
        { name: 'Mahembe', lat: -2.2844, lng: 29.0844 }, { name: 'Nyabitekeri', lat: -2.3444, lng: 29.1644 },
        { name: 'Rangiro', lat: -2.3044, lng: 29.0644 }, { name: 'Ruharambuga', lat: -2.3944, lng: 29.0844 },
        { name: 'Shangi', lat: -2.3244, lng: 29.0444 },
      ]},
      { name: 'Nyanza', lat: -2.3564, lng: 29.7463, sectors: [
        { name: 'Busasamana', lat: -2.3244, lng: 29.7544 }, { name: 'Busoro', lat: -2.3744, lng: 29.7244 },
        { name: 'Cyabakamyi', lat: -2.3444, lng: 29.7744 }, { name: 'Kibirizi', lat: -2.3944, lng: 29.7644 },
        { name: 'Kigoma', lat: -2.3644, lng: 29.7344 }, { name: 'Mukingo', lat: -2.3144, lng: 29.7244 },
        { name: 'Muyira', lat: -2.3844, lng: 29.7544 }, { name: 'Ntyazo', lat: -2.4044, lng: 29.7244 },
        { name: 'Nyagisozi', lat: -2.3344, lng: 29.7744 }, { name: 'Rwabicuma', lat: -2.4244, lng: 29.7544 },
      ]},
      { name: 'Nyaruguru', lat: -2.7011, lng: 29.5571, sectors: [
        { name: 'Cyahinda', lat: -2.6744, lng: 29.5344 }, { name: 'Kibeho', lat: -2.6544, lng: 29.5744 },
        { name: 'Kivu', lat: -2.7244, lng: 29.5144 }, { name: 'Mata', lat: -2.7444, lng: 29.5644 },
        { name: 'Muganza', lat: -2.6944, lng: 29.5644 }, { name: 'Munini', lat: -2.7144, lng: 29.5844 },
        { name: 'Ngera', lat: -2.6844, lng: 29.5044 }, { name: 'Ngoma', lat: -2.7344, lng: 29.5244 },
        { name: 'Nyabimata', lat: -2.7644, lng: 29.5644 }, { name: 'Nyagisozi', lat: -2.7044, lng: 29.5944 },
        { name: 'Ruheru', lat: -2.7844, lng: 29.5344 }, { name: 'Ruramba', lat: -2.6644, lng: 29.5144 },
        { name: 'Rusenge', lat: -2.6444, lng: 29.5444 }, { name: 'Rwimbogo', lat: -2.7144, lng: 29.5044 },
      ]},
      { name: 'Ruhango', lat: -2.2240, lng: 29.7785, sectors: [
        { name: 'Bweramana', lat: -2.2044, lng: 29.7944 }, { name: 'Byimana', lat: -2.2544, lng: 29.7444 },
        { name: 'Kabagari', lat: -2.2244, lng: 29.7444 }, { name: 'Kinazi', lat: -2.1844, lng: 29.7844 },
        { name: 'Kinihira', lat: -2.2744, lng: 29.7844 }, { name: 'Mbuye', lat: -2.2044, lng: 29.7644 },
        { name: 'Mwendo', lat: -2.2444, lng: 29.8144 }, { name: 'Ntongwe', lat: -2.2644, lng: 29.8044 },
        { name: 'Ruhango', lat: -2.2244, lng: 29.7744 },
      ]},
    ],
  },
  {
    name: 'Eastern Province', lat: -1.7000, lng: 30.5000,
    districts: [
      { name: 'Bugesera', lat: -2.1985, lng: 30.1563, sectors: [
        { name: 'Gashora', lat: -2.1844, lng: 30.1244 }, { name: 'Juru', lat: -2.1244, lng: 30.1744 },
        { name: 'Kamabuye', lat: -2.2244, lng: 30.1444 }, { name: 'Ntarama', lat: -2.1644, lng: 30.1044 },
        { name: 'Mareba', lat: -2.2044, lng: 30.2044 }, { name: 'Mayange', lat: -2.2444, lng: 30.1244 },
        { name: 'Musenyi', lat: -2.2644, lng: 30.1644 }, { name: 'Mwogo', lat: -2.1444, lng: 30.1844 },
        { name: 'Ngeruka', lat: -2.1644, lng: 30.2244 }, { name: 'Nyamata', lat: -2.2044, lng: 30.1244 },
        { name: 'Nyarugenge', lat: -2.1844, lng: 30.1644 }, { name: 'Rilima', lat: -2.2444, lng: 30.2044 },
        { name: 'Ruhuha', lat: -2.1044, lng: 30.2044 }, { name: 'Rweru', lat: -2.2844, lng: 30.1844 },
        { name: 'Shyara', lat: -2.2644, lng: 30.0844 },
      ]},
      { name: 'Gatsibo', lat: -1.5886, lng: 30.4636, sectors: [
        { name: 'Gasange', lat: -1.5644, lng: 30.4244 }, { name: 'Gatsibo', lat: -1.5844, lng: 30.4544 },
        { name: 'Gitoki', lat: -1.5244, lng: 30.4744 }, { name: 'Kabarore', lat: -1.5444, lng: 30.4044 },
        { name: 'Kageyo', lat: -1.6244, lng: 30.4244 }, { name: 'Kiramuruzi', lat: -1.6044, lng: 30.4844 },
        { name: 'Kiziguro', lat: -1.6644, lng: 30.4244 }, { name: 'Muhura', lat: -1.5044, lng: 30.5244 },
        { name: 'Murambi', lat: -1.5644, lng: 30.5044 }, { name: 'Ngarama', lat: -1.5844, lng: 30.3844 },
        { name: 'Nyagihanga', lat: -1.5244, lng: 30.4244 }, { name: 'Remera', lat: -1.6444, lng: 30.4944 },
        { name: 'Rugarama', lat: -1.6044, lng: 30.3844 }, { name: 'Rwimbogo', lat: -1.5844, lng: 30.5244 },
      ]},
      { name: 'Kayonza', lat: -1.8831, lng: 30.6520, sectors: [
        { name: 'Gahini', lat: -1.8444, lng: 30.6244 }, { name: 'Kabare', lat: -1.9444, lng: 30.6644 },
        { name: 'Kabarondo', lat: -1.9844, lng: 30.5844 }, { name: 'Mukarange', lat: -1.8244, lng: 30.6644 },
        { name: 'Murama', lat: -1.8644, lng: 30.6444 }, { name: 'Murundi', lat: -1.9044, lng: 30.7044 },
        { name: 'Mwiri', lat: -1.8244, lng: 30.7244 }, { name: 'Ndego', lat: -1.9644, lng: 30.7044 },
        { name: 'Nyamirama', lat: -1.9044, lng: 30.6244 }, { name: 'Rukara', lat: -1.8644, lng: 30.5844 },
        { name: 'Ruramira', lat: -1.8844, lng: 30.7244 }, { name: 'Rwinkwavu', lat: -1.9244, lng: 30.6844 },
      ]},
      { name: 'Kirehe', lat: -2.1603, lng: 30.6605, sectors: [
        { name: 'Gahara', lat: -2.1444, lng: 30.6244 }, { name: 'Gatore', lat: -2.2044, lng: 30.6644 },
        { name: 'Kigarama', lat: -2.1844, lng: 30.6044 }, { name: 'Kigina', lat: -2.1244, lng: 30.7044 },
        { name: 'Kirehe', lat: -2.1644, lng: 30.6544 }, { name: 'Mahama', lat: -2.2244, lng: 30.7044 },
        { name: 'Mpanga', lat: -2.1444, lng: 30.6844 }, { name: 'Musaza', lat: -2.0844, lng: 30.6844 },
        { name: 'Mushikiri', lat: -2.1244, lng: 30.6244 }, { name: 'Nasho', lat: -2.2444, lng: 30.6244 },
        { name: 'Nyamugari', lat: -2.2044, lng: 30.6244 }, { name: 'Nyarubuye', lat: -2.0844, lng: 30.7244 },
      ]},
      { name: 'Ngoma', lat: -2.1667, lng: 30.4667, sectors: [
        { name: 'Gashanda', lat: -2.1444, lng: 30.4444 }, { name: 'Jarama', lat: -2.1244, lng: 30.5044 },
        { name: 'Karembo', lat: -2.2044, lng: 30.4444 }, { name: 'Kazo', lat: -2.1644, lng: 30.4244 },
        { name: 'Kibungo', lat: -2.1544, lng: 30.5244 }, { name: 'Mugesera', lat: -2.1844, lng: 30.4844 },
        { name: 'Murama', lat: -2.2244, lng: 30.4844 }, { name: 'Mutenderi', lat: -2.2044, lng: 30.5244 },
        { name: 'Remera', lat: -2.1044, lng: 30.4844 }, { name: 'Rukira', lat: -2.2644, lng: 30.4644 },
        { name: 'Rukumberi', lat: -2.2244, lng: 30.5644 }, { name: 'Rurenge', lat: -2.1644, lng: 30.5044 },
        { name: 'Sake', lat: -2.1244, lng: 30.4244 }, { name: 'Zaza', lat: -2.1444, lng: 30.3644 },
      ]},
      { name: 'Nyagatare', lat: -1.2923, lng: 30.3313, sectors: [
        { name: 'Gatabagame', lat: -1.2244, lng: 30.3644 }, { name: 'Gatunda', lat: -1.0644, lng: 30.4844 },
        { name: 'Karama', lat: -1.3244, lng: 30.2844 }, { name: 'Karangazi', lat: -1.1844, lng: 30.4444 },
        { name: 'Katabagemu', lat: -1.2044, lng: 30.2844 }, { name: 'Kiyombe', lat: -1.1244, lng: 30.2644 },
        { name: 'Matimba', lat: -1.3644, lng: 30.4044 }, { name: 'Mimuli', lat: -1.2644, lng: 30.4244 },
        { name: 'Mukama', lat: -1.2644, lng: 30.3644 }, { name: 'Musheli', lat: -1.1644, lng: 30.3244 },
        { name: 'Nyagatare', lat: -1.2944, lng: 30.3244 }, { name: 'Rukomo', lat: -1.2244, lng: 30.3044 },
        { name: 'Rwempasha', lat: -1.1444, lng: 30.5244 }, { name: 'Rwimiyaga', lat: -1.0844, lng: 30.3244 },
        { name: 'Tabagwe', lat: -1.3244, lng: 30.4444 },
      ]},
      { name: 'Rwamagana', lat: -1.9492, lng: 30.4353, sectors: [
        { name: 'Fumbwe', lat: -1.9244, lng: 30.3844 }, { name: 'Gahengeri', lat: -1.9644, lng: 30.4744 },
        { name: 'Gishari', lat: -1.9044, lng: 30.4244 }, { name: 'Karenge', lat: -2.0044, lng: 30.4244 },
        { name: 'Kigabiro', lat: -1.9444, lng: 30.4844 }, { name: 'Muhazi', lat: -1.9244, lng: 30.4444 },
        { name: 'Munyaga', lat: -2.0044, lng: 30.4744 }, { name: 'Munyiginya', lat: -1.9844, lng: 30.3844 },
        { name: 'Musha', lat: -1.9644, lng: 30.3644 }, { name: 'Muyumbu', lat: -1.8844, lng: 30.4044 },
        { name: 'Mwulire', lat: -1.8844, lng: 30.4844 }, { name: 'Nyakaliro', lat: -1.9044, lng: 30.5044 },
        { name: 'Nzige', lat: -1.9844, lng: 30.5244 }, { name: 'Rubona', lat: -1.9244, lng: 30.3644 },
      ]},
    ],
  },
  {
    name: 'Western Province', lat: -2.1000, lng: 29.3000,
    districts: [
      { name: 'Karongi', lat: -2.0625, lng: 29.3644, sectors: [
        { name: 'Bwishyura', lat: -2.0644, lng: 29.3444 }, { name: 'Gashari', lat: -2.0244, lng: 29.3644 },
        { name: 'Gishyita', lat: -2.0444, lng: 29.2844 }, { name: 'Gitesi', lat: -2.0844, lng: 29.3844 },
        { name: 'Mubuga', lat: -2.1244, lng: 29.3244 }, { name: 'Murambi', lat: -2.0644, lng: 29.4244 },
        { name: 'Murundi', lat: -2.1044, lng: 29.3044 }, { name: 'Mutuntu', lat: -2.0244, lng: 29.4044 },
        { name: 'Rubengera', lat: -2.0244, lng: 29.3244 }, { name: 'Rugabano', lat: -1.9844, lng: 29.3844 },
        { name: 'Ruganda', lat: -1.9844, lng: 29.4244 }, { name: 'Rwankuba', lat: -2.0444, lng: 29.4444 },
        { name: 'Twumba', lat: -2.1444, lng: 29.3844 },
      ]},
      { name: 'Ngororero', lat: -1.8833, lng: 29.5167, sectors: [
        { name: 'Bwira', lat: -1.8644, lng: 29.4844 }, { name: 'Gatumba', lat: -1.8444, lng: 29.5444 },
        { name: 'Hindiro', lat: -1.9244, lng: 29.5244 }, { name: 'Kabaya', lat: -1.8844, lng: 29.5244 },
        { name: 'Kageyo', lat: -1.8244, lng: 29.4844 }, { name: 'Kavumu', lat: -1.9044, lng: 29.4644 },
        { name: 'Matyazo', lat: -1.9244, lng: 29.5644 }, { name: 'Muhanda', lat: -1.8244, lng: 29.5244 },
        { name: 'Muhororo', lat: -1.8644, lng: 29.5644 }, { name: 'Ndaro', lat: -1.9444, lng: 29.4844 },
        { name: 'Ngororero', lat: -1.8944, lng: 29.5044 }, { name: 'Nyange', lat: -1.8444, lng: 29.5644 },
        { name: 'Sovu', lat: -1.9644, lng: 29.5244 },
      ]},
      { name: 'Nyabihu', lat: -1.5744, lng: 29.4983, sectors: [
        { name: 'Bganda', lat: -1.5844, lng: 29.4744 }, { name: 'Jenda', lat: -1.5444, lng: 29.4644 },
        { name: 'Jomba', lat: -1.5044, lng: 29.5344 }, { name: 'Kabatwa', lat: -1.6044, lng: 29.4644 },
        { name: 'Karago', lat: -1.5644, lng: 29.5444 }, { name: 'Kintobo', lat: -1.5244, lng: 29.4844 },
        { name: 'Mukamira', lat: -1.5844, lng: 29.5244 }, { name: 'Muringa', lat: -1.6244, lng: 29.5444 },
        { name: 'Rambura', lat: -1.5444, lng: 29.5044 }, { name: 'Rugera', lat: -1.6044, lng: 29.5044 },
        { name: 'Rurembo', lat: -1.5644, lng: 29.4644 }, { name: 'Shyira', lat: -1.5044, lng: 29.4444 },
      ]},
      { name: 'Rubavu', lat: -1.6789, lng: 29.2556, sectors: [
        { name: 'Bugeshi', lat: -1.7044, lng: 29.2244 }, { name: 'Busasamana', lat: -1.7644, lng: 29.2444 },
        { name: 'Cyanzarwe', lat: -1.6844, lng: 29.1844 }, { name: 'Gisenyi', lat: -1.7044, lng: 29.2544 },
        { name: 'Kanama', lat: -1.6244, lng: 29.2044 }, { name: 'Kanzenze', lat: -1.7244, lng: 29.3244 },
        { name: 'Mudende', lat: -1.7244, lng: 29.3044 }, { name: 'Nyakiliba', lat: -1.6444, lng: 29.2444 },
        { name: 'Nyamyumba', lat: -1.7444, lng: 29.2244 }, { name: 'Nyundo', lat: -1.6644, lng: 29.2044 },
        { name: 'Rubavu', lat: -1.7144, lng: 29.2644 }, { name: 'Rugerero', lat: -1.7444, lng: 29.2944 },
      ]},
      { name: 'Rutsiro', lat: -1.8667, lng: 29.4167, sectors: [
        { name: 'Boneza', lat: -1.8844, lng: 29.3544 }, { name: 'Gihango', lat: -1.8444, lng: 29.4544 },
        { name: 'Kigeyo', lat: -1.8244, lng: 29.3844 }, { name: 'Kivumu', lat: -1.9044, lng: 29.3844 },
        { name: 'Manihira', lat: -1.8644, lng: 29.3844 }, { name: 'Mukura', lat: -1.9444, lng: 29.4244 },
        { name: 'Murunda', lat: -1.8444, lng: 29.3544 }, { name: 'Musasa', lat: -1.9244, lng: 29.3644 },
        { name: 'Mushonyi', lat: -1.8244, lng: 29.4144 }, { name: 'Mushubati', lat: -1.8644, lng: 29.4444 },
        { name: 'Nyabirasi', lat: -1.9044, lng: 29.4444 }, { name: 'Ruhango', lat: -1.8044, lng: 29.3844 },
        { name: 'Rusebeya', lat: -1.9244, lng: 29.3244 },
      ]},
      { name: 'Rusizi', lat: -2.4844, lng: 28.9062, sectors: [
        { name: 'Bugarama', lat: -2.5244, lng: 28.8844 }, { name: 'Bweyeye', lat: -2.5444, lng: 28.9444 },
        { name: 'Gashonga', lat: -2.4844, lng: 28.9244 }, { name: 'Giheke', lat: -2.4244, lng: 28.8644 },
        { name: 'Gihundwe', lat: -2.4444, lng: 28.9044 }, { name: 'Gikundamvura', lat: -2.4644, lng: 28.9244 },
        { name: 'Gitambi', lat: -2.5644, lng: 29.0044 }, { name: 'Kamembe', lat: -2.4744, lng: 28.9144 },
        { name: 'Muganza', lat: -2.5044, lng: 28.9644 }, { name: 'Mururu', lat: -2.5244, lng: 29.0244 },
        { name: 'Nkanka', lat: -2.4644, lng: 28.8644 }, { name: 'Nkungu', lat: -2.4044, lng: 28.9244 },
        { name: 'Nyakarenzo', lat: -2.5444, lng: 29.0644 }, { name: 'Nzahaha', lat: -2.4444, lng: 28.8844 },
        { name: 'Rwimbogo', lat: -2.5044, lng: 29.0444 },
      ]},
    ],
  },
];

async function seedRwandaLocations(locRepo: any) {
  const inserted: Record<string, any> = {};

  for (const prov of RWANDA) {
    const province = await locRepo.save({ name: prov.name, type: LocationType.PROVINCE, latitude: prov.lat, longitude: prov.lng });
    inserted[prov.name] = province;

    for (const dist of prov.districts) {
      const district = await locRepo.save({ name: dist.name, type: LocationType.DISTRICT, parent: province, latitude: dist.lat, longitude: dist.lng });
      inserted[`${prov.name}/${dist.name}`] = district;

      for (const sec of dist.sectors) {
        const sector = await locRepo.save({ name: sec.name, type: LocationType.SECTOR, parent: district, latitude: sec.lat, longitude: sec.lng });
        inserted[`${prov.name}/${dist.name}/${sec.name}`] = sector;
      }
    }
  }
  return inserted;
}

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
  await dataSource.query(`TRUNCATE TABLE "location_nodes" CASCADE`);

  console.log('Database cleared. Seeding initial data...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Seed Insurances
  const insuranceRepo = dataSource.getRepository(Insurance);
  const insurances = await insuranceRepo.save([
    { providerName: 'RAMA', defaultCoveragePercentage: 85.00 },
    { providerName: 'MMI', defaultCoveragePercentage: 85.00 },
    { providerName: 'UAP Insurance', defaultCoveragePercentage: 100.00 },
    { providerName: 'Radiant Insurance', defaultCoveragePercentage: 80.00 },
  ]);
  console.log(`Seeded ${insurances.length} insurances.`);

  // 1b. Seed Rwanda Location Hierarchy
  const locRepo = dataSource.getRepository(LocationNode);
  console.log('Seeding Rwanda administrative hierarchy (5 Provinces, 30 Districts, ~416 Sectors)...');
  const locations = await seedRwandaLocations(locRepo);
  const totalNodes = await locRepo.count();
  console.log(`Seeded ${totalNodes} location nodes.`);

  // Grab key sectors for pharmacy placement
  const muhozaSector   = locations['Northern Province/Musanze/Muhoza'];
  const kinigiSector   = locations['Northern Province/Musanze/Kinigi'];
  const karemboSector  = locations['Eastern Province/Ngoma/Karembo'];
  const gishanvuSector = locations['Southern Province/Huye/Gishamvu'];
  const kacyiruSector  = locations['Kigali City/Gasabo/Kacyiru'];
  const kimirankSector = locations['Kigali City/Gasabo/Kimironko'];

  // 2. Seed Users
  const userRepo = dataSource.getRepository(User);
  const usersToCreate = [
    { email: 'admin@belyse.com', passwordHash, firstName: 'System', lastName: 'Admin', role: UserRole.ADMIN, phone: '0780000000' },
    { email: 'pharmacist.volcans@belyse.com', passwordHash, firstName: 'Jean', lastName: 'Damascene', role: UserRole.PHARMACIST, phone: '0780000001' },
    { email: 'pharmacist.muhoza@belyse.com', passwordHash, firstName: 'Marie', lastName: 'Claire', role: UserRole.PHARMACIST, phone: '0780000002' },
    { email: 'pharmacist.kinigi@belyse.com', passwordHash, firstName: 'Eric', lastName: 'Manzi', role: UserRole.PHARMACIST, phone: '0780000003' },
    { email: 'patient1@belyse.com', passwordHash, firstName: 'Alice', lastName: 'Uwase', role: UserRole.PATIENT, phone: '0780000004', insuranceProvider: insurances[0], insuranceNumber: 'RAMA-12345', isInsuranceVerified: true },
    { email: 'patient2@belyse.com', passwordHash, firstName: 'Bob', lastName: 'Ntwari', role: UserRole.PATIENT, phone: '0780000005', insuranceProvider: insurances[2], insuranceNumber: 'CBHI-98765', isInsuranceVerified: true },
    { email: 'tuyishimemaximillien@gmail.com', passwordHash, firstName: 'Maximillien', lastName: 'TUYISHIME', role: UserRole.PATIENT, phone: '0784321588' },
    { email: 'patient3@belyse.com', passwordHash, firstName: 'Chantal', lastName: 'Mugisha', role: UserRole.PATIENT, phone: '0780000006' },
  ];
  const users = await userRepo.save(usersToCreate);
  console.log(`Seeded ${users.length} users.`);

  const pharmacists = users.filter(u => u.role === UserRole.PHARMACIST);
  const patients = users.filter(u => u.role === UserRole.PATIENT);

  // 3. Seed Pharmacies
  const pharmacyRepo = dataSource.getRepository(Pharmacy);
  const pharmaciesToCreate: DeepPartial<Pharmacy>[] = [
    {
      name: 'Pharmacie des Volcans',
      licenseNumber: 'LIC-MUS-001',
      address: 'Musanze City Center, Muhoza Sector',
      phone: '0781111111',
      description: 'A trusted pharmacy in the heart of Musanze, providing a wide range of medical supplies.',
      openingTime: 7, closingTime: 22,
      location: { province: 'Northern Province', district: 'Musanze', sector: 'Muhoza', latitude: -1.4978, longitude: 29.6344 },
      status: PharmacyStatus.ACTIVE, isActive: true,
      owner: pharmacists[0], offersDelivery: true,
    },
    {
      name: 'Pharmacie Muhoza',
      licenseNumber: 'LIC-MUS-002',
      address: 'Near Ruhengeri Hospital, Muhoza Sector',
      phone: '0782222222',
      description: 'Your reliable neighborhood pharmacy offering quality medicines and health advice.',
      openingTime: 8, closingTime: 20,
      location: { province: 'Northern Province', district: 'Musanze', sector: 'Muhoza', latitude: -1.5020, longitude: 29.6380 },
      status: PharmacyStatus.ACTIVE, isActive: true,
      owner: pharmacists[1], offersDelivery: true,
    },
    {
      name: 'Kinigi Health Pharmacy',
      licenseNumber: 'LIC-MUS-003',
      address: 'Kinigi Sector, Near Volcanoes National Park',
      phone: '0783333333',
      description: 'Providing essential medicines for locals and tourists in Kinigi.',
      openingTime: 8, closingTime: 18,
      location: { province: 'Northern Province', district: 'Musanze', sector: 'Kinigi', latitude: -1.4378, longitude: 29.5944 },
      status: PharmacyStatus.ACTIVE, isActive: true,
      owner: pharmacists[2], offersDelivery: false,
    },
  ];

  const pharmacies = await pharmacyRepo.save(pharmaciesToCreate);
  console.log(`Seeded ${pharmacies.length} pharmacies.`);

  // 3b. Seed PharmacyInsurance pivot records
  const piRepo = dataSource.getRepository(PharmacyInsurance);
  const piRecords: DeepPartial<PharmacyInsurance>[] = [
    { pharmacyId: pharmacies[0].id, insuranceId: insurances[0].id, coveragePercentage: 85 },
    { pharmacyId: pharmacies[0].id, insuranceId: insurances[1].id, coveragePercentage: 85 },
    { pharmacyId: pharmacies[0].id, insuranceId: insurances[2].id, coveragePercentage: 90 },
    { pharmacyId: pharmacies[1].id, insuranceId: insurances[2].id, coveragePercentage: 90 },
    { pharmacyId: pharmacies[1].id, insuranceId: insurances[3].id, coveragePercentage: 100 },
    { pharmacyId: pharmacies[2].id, insuranceId: insurances[0].id, coveragePercentage: 80 },
    { pharmacyId: pharmacies[2].id, insuranceId: insurances[4].id, coveragePercentage: 75 },
  ];
  await piRepo.save(piRecords);
  console.log(`Seeded ${piRecords.length} pharmacy-insurance links.`);

  // 4. Seed Medicines
  const medicineRepo = dataSource.getRepository(Medicine);
  const medicinesToCreate = [
    { name: 'Paracetamol 500mg', category: MedicineCategory.PAINKILLER, description: 'Used to treat mild to moderate pain and reduce fever.', requiresPrescription: false, imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80' },
    { name: 'Ibuprofen 400mg', category: MedicineCategory.PAINKILLER, description: 'Nonsteroidal anti-inflammatory drug for pain relief and fever.', requiresPrescription: false, imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=200&q=80' },
    { name: 'Amoxicillin 500mg', category: MedicineCategory.ANTIBIOTIC, description: 'Penicillin antibiotic for bacterial infections.', requiresPrescription: true, imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&q=80' },
    { name: 'Ciprofloxacin 500mg', category: MedicineCategory.ANTIBIOTIC, description: 'Fluoroquinolone antibiotic for bacterial infections.', requiresPrescription: true, imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&q=80' },
    { name: 'Omeprazole 20mg', category: MedicineCategory.GASTROINTESTINAL, description: 'Proton pump inhibitor for GERD treatment.', requiresPrescription: true, imageUrl: 'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=200&q=80' },
    { name: 'Cetirizine 10mg', category: MedicineCategory.OTHER, description: 'Antihistamine for allergy symptoms.', requiresPrescription: false, imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&q=80' },
    { name: 'Vitamin C 1000mg', category: MedicineCategory.VITAMIN, description: 'Essential vitamin for immune system support.', requiresPrescription: false, imageUrl: 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=200&q=80' },
    { name: 'Metformin 500mg', category: MedicineCategory.DIABETIC, description: 'Medication for type 2 diabetes.', requiresPrescription: true, imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=200&q=80' },
    { name: 'Amlodipine 5mg', category: MedicineCategory.CARDIOVASCULAR, description: 'Calcium channel blocker for high blood pressure.', requiresPrescription: true, imageUrl: 'https://images.unsplash.com/photo-1578496479531-32e296d5c6e1?w=200&q=80' },
    { name: 'Fluconazole 150mg', category: MedicineCategory.ANTIFUNGAL, description: 'Antifungal for fungal infections.', requiresPrescription: true, imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&q=80' },
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
    for (const item of shuffledItems.slice(0, numItems)) {
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({ medicine: item.medicine, quantity, priceAtReservation: item.price });
      totalAmount += (item.price * quantity);
    }

    const statuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let insurancePays = 0;
    if (patient.isInsuranceVerified && patient.insuranceProvider) {
      insurancePays = totalAmount * 0.85;
    }
    const patientPays = totalAmount - insurancePays;
    const isDelivery = Math.random() > 0.5 && pharmacy.offersDelivery;

    reservationsToCreate.push({
      patient, pharmacy, items, status,
      paymentMethod: Math.random() > 0.5 ? PaymentMethod.PAY_ONLINE : PaymentMethod.PAY_AT_PHARMACY,
      paymentStatus: status === ReservationStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      deliveryOption: isDelivery ? DeliveryOption.HOME_DELIVERY : DeliveryOption.PICKUP,
      deliveryFee: isDelivery ? 1000 : 0,
      deliveryAddress: isDelivery ? 'Musanze, Sector Muhoza' : undefined,
      deliveryStatus: isDelivery && status === ReservationStatus.CONFIRMED ? DeliveryStatus.PENDING : undefined,
      totalAmount, patientPays, insurancePays,
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
