import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment } from './payment.entity';
import { StripeService } from './stripe.service';
import { DroitEntreeGuard } from './droit-entree.guard';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    forwardRef(() => SalesModule)
  ],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, DroitEntreeGuard],
  exports: [PaymentService, StripeService, DroitEntreeGuard]
})
export class PaymentModule {}