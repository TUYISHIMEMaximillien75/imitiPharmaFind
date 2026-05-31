import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { SearchRequestDto } from './dto/search-request.dto';

@ApiTags('search')
@SkipThrottle()
@Controller('search')
export class SearchController {

  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: 'Search pharmacies by medicine name' })
  @Post()
  async searchPharmacies(@Body() dto: SearchRequestDto) {
    return this.searchService.searchPharmacies(dto);
  }
}
