import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { Link } from './link';
import { LinkController } from './link.controller';
import { LinkService } from './link.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([Link])
  ],
  controllers: [LinkController],
  providers: [LinkService]
})
export class LinkModule {}
