import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchRequestDto } from './dto/search-request.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {

  constructor(private readonly searchService: SearchService) {}

  @Post()
  async searchPharmacies(@Body() dto: SearchRequestDto) {
    return this.searchService.searchPharmacies(dto);
  }
}
