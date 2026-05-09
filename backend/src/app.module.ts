import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Pharmacy } from './pharmacies/entities/pharmacy.entity';
import { Insurance } from './insurances/entities/insurance.entity';
import { InsurancesModule } from './insurances/insurances.module';
import { LocationsModule } from './locations/locations.module';
import { Prescription } from './prescriptions/entities/prescription.entity';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { Medicine } from './medicines/entities/medicine.entity';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('NEON_DB_URL');
        const useSSL = dbUrl ? true : false;

        return {
          type: 'postgres',

          // Use URL if available (Neon / production)
          ...(dbUrl
            ? {
              url: dbUrl,
              ssl: { rejectUnauthorized: false },
            }
            : {
              // Otherwise use local DB config (your friend)
              host: configService.get<string>('DB_HOST'),
              port: configService.get<number>('DB_PORT') || 5432,
              username: configService.get<string>('DB_USERNAME'),
              password: configService.get<string>('DB_PASSWORD'),
              database: configService.get<string>('DB_DATABASE'),
              ssl: false,
            }),

          entities: [User, Pharmacy, Insurance, Prescription, Medicine, InventoryItem],
          synchronize: true, //  Dev only (disable in production)
        };
      },
    }),

    AuthModule,
    InsurancesModule,
    LocationsModule,
    PrescriptionsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }