import { Controller, Get, Patch, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Post('me/insurance/verify')
  async verifyInsurance(@Request() req: any) {
    try {
      return await this.usersService.verifyInsurance(req.user.id);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
