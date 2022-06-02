import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDTO } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Post(['admin/register', 'ambassador/register'])
  async register(@Body() body: RegisterDTO, @Req() request: Request) {
    const { password_confirm, ...data } = body;

    if (body.password !== password_confirm) {
      throw new BadRequestException('Password do not match !');
    }

    const hashed = await bcrypt.hash(body.password, 12);
    console.log(request.path);

    return this.userService.save({
      ...data,
      password: hashed,
      is_ambassador: request.path === '/api/auth/ambassador/register',
    });
  }

  @Post(['admin/login', 'ambassador/login'])
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const user = await this.userService.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid login credentials !');
    }

    const adminLogin = request.path === '/api/auth/admin/login';

    if (user.is_ambassador && adminLogin) {
      throw new UnauthorizedException();
    }

    const jwt = await this.jwtService.signAsync({
      id: user.id,
      scope: !adminLogin ? 'ambassador' : 'admin',
    });

    response.cookie('jwt', jwt, { httpOnly: true });

    return {
      message: 'Login successful',
    };
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(['admin/user', 'ambassador/user'])
  async user(@Req() req: Request) {
    const cookie = req.cookies['jwt'];

    const { id } = await this.jwtService.verifyAsync(cookie);

    if(req.path === '/api/auth/admin/user'){
      return await this.userService.findOne({id})
    }

    const user = await this.userService.findOne({
      id,
      relations: ['orders'],
    });

    return {
      ...user,
      revenue: user.revenue,
    };
  }

  @UseGuards(AuthGuard)
  @Get(['admin/logout', 'ambassador/logout'])
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');

    return {
      message: 'Logout Successfull',
    };
  }

  @UseGuards(AuthGuard)
  @Put(['admin/user/info', 'ambassador/user/info'])
  async updateInfo(
    @Req() req: Request,
    @Body('first_name') first_name: string,
    @Body('last_name') last_name: string,
    @Body('email') email: string,
  ) {
    const cookie = req.cookies['jwt'];
    const { id } = await this.jwtService.verifyAsync(cookie);

    await this.userService.update(id, {
      first_name,
      last_name,
      email,
    });

    return this.userService.findOne({ id });
  }

  @UseGuards(AuthGuard)
  @Put(['admin/user/password', 'ambassador/user/password'])
  async updatePassword(
    @Req() req: Request,
    @Body('password') password: string,
    @Body('password_confirm') password_confirm: string,
  ) {
    if (password !== password_confirm) {
      throw new BadRequestException('Password do not match !');
    }
    const cookie = req.cookies['jwt'];
    const { id } = await this.jwtService.verifyAsync(cookie);

    await this.userService.update(id, {
      password: await bcrypt.hash(password, 12),
    });

    return {
      message: 'Password changed successfully',
    };
  }
}
