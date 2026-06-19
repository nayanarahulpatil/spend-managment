import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RedisModule } from '../../database/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
    RedisModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
