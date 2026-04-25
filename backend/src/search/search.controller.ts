import { Controller, Post, Body } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchRequestDto } from './dto/search-request.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('pharmacies')
  async searchPharmacies(@Body() dto: SearchRequestDto) {
    return this.searchService.searchPharmacies(dto);
  }
}
