import { Module } from '@nestjs/common';
import { ExpensesModule } from '../expenses/expenses.module';
import { UsersModule } from '../users/users.module';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';

@Module({
  imports: [ExpensesModule, UsersModule],
  providers: [ReportingService],
  controllers: [ReportingController],
})
export class ReportingModule {}

