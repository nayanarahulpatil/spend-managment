import { Module } from '@nestjs/common';
import { ExpensesModule } from '../expenses/expenses.module';
import { UsersModule } from '../users/users.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [ExpensesModule, UsersModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}

