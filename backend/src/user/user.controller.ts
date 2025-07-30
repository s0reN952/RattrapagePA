import { Controller, Post, Body, Get, Put, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() userData: Partial<User>): Promise<User> {
    return this.userService.create(userData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any): Promise<Partial<User>> {
    const user = await this.userService.findByEmail(req.user.email);
    if (!user) return {};
    const { password, ...rest } = user;
    return rest;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me')
  async updateMe(@Req() req: any, @Body() data: Partial<User>): Promise<Partial<User>> {
    const user = await this.userService.findByEmail(req.user.email);
    if (!user) return {};
    
    const updatedUser = await this.userService.update(user.id, data);
    if (!updatedUser) return {};
    
    const { password, ...rest } = updatedUser;
    return rest;
  }
} 