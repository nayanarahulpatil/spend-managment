import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../../database/redis.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    UsersModule,
    RedisModule,
  ],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
