import { Controller, Post, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrescriptionsService } from './prescriptions.service';
import { SavePrescriptionDto } from './dto/save-prescription.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('temp-verify')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/prescriptions',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    })
  }))
  async tempVerify(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Call OCR service
    const { rawText, medicines } = await this.prescriptionsService.runOcr(file.path);

    // Return the URL path where the image is now hosted and the medicines
    // Mounted /uploads as static assets in main.ts
    const imageUrl = `/uploads/prescriptions/${file.filename}`;

    return {
      imageUrl,
      rawText,
      medicines
    };
  }

  @Post()
  async savePrescription(@Body() saveDto: SavePrescriptionDto) {
    return this.prescriptionsService.savePrescription(saveDto);
  }
}
