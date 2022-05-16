import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDTO } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Post('admin/register')
  async register(@Body() body: RegisterDTO) {
    const { password_confirm, ...data } = body;

    if (body.password !== password_confirm) {
      throw new BadRequestException('Password do not match !');
    }

    const hashed = await bcrypt.hash(body.password, 12);

    return this.userService.save({
      ...data,
      password: hashed,
      is_ambassador: false,
    });
  }

  @Post('admin/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid login credentials !');
    }

    const jwt = await this.jwtService.signAsync({
      id: user.id,
    });

    response.cookie('jwt', jwt, { httpOnly: true });

    return {
      message: 'Login successful',
    };
  }
}
