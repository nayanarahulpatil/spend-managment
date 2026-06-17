import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpensesModule } from '../expenses/expenses.module';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowRule, WorkflowRuleSchema } from './schemas/workflow-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WorkflowRule.name, schema: WorkflowRuleSchema }]),
    ExpensesModule,
  ],
  providers: [WorkflowService],
  controllers: [WorkflowController],
})
export class WorkflowModule {}
