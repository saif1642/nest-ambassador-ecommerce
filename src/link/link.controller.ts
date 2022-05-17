import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { LinkService } from './link.service';

@Controller()
export class LinkController {
    constructor(
        private linkService: LinkService
    ) {}

    @UseGuards(AuthGuard)
    @Get('admin/user/:id/links')
    async all(@Param('id') id: number) {
        return this.linkService.find({
            user: id,
            relations: ['orders']
        });
    }
}
