import { Module } from '@nestjs/common';
import { ExpensesModule } from '../expenses/expenses.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [ExpensesModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
