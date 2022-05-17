import { ClassSerializerInterceptor, Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
    constructor(private orderService: OrderService) {}


    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(AuthGuard)
    @Get('admin/orders')
    async all() {
        return this.orderService.find({
            relations: ['order_items']
        });
    }
}
