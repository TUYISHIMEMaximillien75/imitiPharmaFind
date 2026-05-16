import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
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
import { MedicinesModule } from './medicines/medicines.module';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { InventoryModule } from './inventory/inventory.module';
import { SearchModule } from './search/search.module';
import { Reservation } from './reservations/entities/reservation.entity';
import { ReservationItem } from './reservations/entities/reservation-item.entity';
import { ReservationsModule } from './reservations/reservations.module';
import { PharmaciesModule } from './pharmacies/pharmacies.module';
import { UsersModule } from './users/users.module';
import { PharmacyInsurance } from './pharmacies/entities/pharmacy-insurance.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // Database — at least one connection method must be configured
        NEON_DB_URL: Joi.string().optional(),
        DB_HOST: Joi.string().when('NEON_DB_URL', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().when('NEON_DB_URL', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
        DB_PASSWORD: Joi.string().when('NEON_DB_URL', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
        DB_DATABASE: Joi.string().when('NEON_DB_URL', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
        // Auth
        JWT_SECRET: Joi.string().min(16).required(),
        // Optional
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173'),
      }),
      validationOptions: { abortEarly: false },
    }),

    /* ── Rate limiting: 60 requests per 60 seconds per IP (global) ── */
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'auth',    ttl: 60_000, limit: 10 }, // tighter for auth endpoints
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('NEON_DB_URL');

        return {
          type: 'postgres',

          // Use URL if available (Neon / production)
          ...(dbUrl
            ? {
                url: dbUrl,
                ssl: { rejectUnauthorized: false },
              }
            : {
                // Otherwise use local DB config
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT') || 5432,
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                ssl: false,
              }),

          entities: [
            User,
            Pharmacy,
            PharmacyInsurance,
            Insurance,
            Prescription,
            Medicine,
            InventoryItem,
            Reservation,
            ReservationItem,
          ],
          synchronize: true, // Dev only
        };
      },
    }),

    AuthModule,
    UsersModule,
    PharmaciesModule,
    MedicinesModule,
    InventoryModule,
    InsurancesModule,
    LocationsModule,
    PrescriptionsModule,
    SearchModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally to every endpoint
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}