import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { SavePrescriptionDto } from './dto/save-prescription.dto';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    @InjectRepository(Prescription)
    private prescriptionsRepository: Repository<Prescription>,
  ) {}

  async runOcr(filePath: string): Promise<{ rawText: string; medicines: string[] }> {
    this.logger.log(`Running OCR on ${filePath}`);
    try {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => this.logger.debug(m.status)
      });
      
      const rawText = text;
      // Basic heuristic: split by lines, trim, ignore short lines
      const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 2);
      
      // Attempting to filter out common noise
      const medicines = lines.filter(line => {
        // Exclude lines with common non-medicine words
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('dr.') || lowerLine.includes('date') || lowerLine.includes('patient') || lowerLine.includes('signature')) return false;
        
        // Match things that look like medicine names (letters, optionally numbers for dosage)
        return /[a-zA-Z]{3,}/.test(line);
      });

      return { rawText, medicines };
    } catch (error) {
      this.logger.error('OCR failed', error);
      throw error;
    }
  }

  async savePrescription(createDto: SavePrescriptionDto): Promise<Prescription> {
    const prescription = this.prescriptionsRepository.create({
      imageUrl: createDto.imageUrl,
      extractedMedicines: createDto.medicines,
      status: 'confirmed', // Once saved, considered confirmed by user
      userId: createDto.userId,
    });
    return this.prescriptionsRepository.save(prescription);
  }
}
