import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExpensesService } from '../expenses/expenses.service';
import { WorkflowRule } from './schemas/workflow-rule.schema';

@Injectable()
export class WorkflowService implements OnModuleInit {
  constructor(
    private readonly expensesService: ExpensesService,
    @InjectModel(WorkflowRule.name) private readonly workflowRuleModel: Model<WorkflowRule>,
  ) {}

  async onModuleInit() {
    const ruleName = 'Standard Approval Workflow';
    const existingRule = await this.workflowRuleModel.findOne({ name: ruleName }).exec();
    if (!existingRule) {
      const defaultRule = new this.workflowRuleModel({
        name: ruleName,
        isActive: true,
        levels: [
          {
            level: 1,
            name: 'Direct Manager',
            description: 'Approves requests up to $5,000',
            limit: 5000,
            slaHours: 48,
            autoEscalate: true,
            condition: null
          },
          {
            level: 2,
            name: 'Finance / Department Head',
            description: 'Required for all travel & capital expenses',
            limit: 50000,
            slaHours: 24,
            autoEscalate: true,
            condition: 'Value > $5,000 OR Category = "Hardware" OR Category = "Travel"'
          },
          {
            level: 3,
            name: 'Executive Approval',
            description: 'Mandatory for high-value strategic items',
            limit: 1000000,
            slaHours: 0,
            autoEscalate: false,
            condition: 'Value > $50,000'
          }
        ]
      });
      await defaultRule.save();
      console.log('Seeded default WorkflowRule: Standard Approval Workflow');
    }
  }

  async getRules(): Promise<WorkflowRule> {
    const rule = await this.workflowRuleModel.findOne({ name: 'Standard Approval Workflow' }).exec();
    if (!rule) {
      throw new NotFoundException('Workflow configuration not found');
    }
    return rule;
  }

  async updateRules(levels: any[]): Promise<WorkflowRule> {
    const rule = await this.workflowRuleModel.findOneAndUpdate(
      { name: 'Standard Approval Workflow' },
      { levels },
      { new: true }
    ).exec();
    if (!rule) {
      throw new NotFoundException('Workflow configuration not found');
    }
    return rule;
  }

  async applyAiRecommendations(): Promise<WorkflowRule> {
    const rule = await this.workflowRuleModel.findOne({ name: 'Standard Approval Workflow' }).exec();
    if (!rule) {
      throw new NotFoundException('Workflow configuration not found');
    }
    
    // AI recommendation: Consolidate Level 1 to $200 to reduce fatigue
    const updatedLevels = rule.levels.map((lvl) => {
      if (lvl.level === 1) {
        return {
          level: lvl.level,
          name: lvl.name,
          limit: 200,
          description: 'Approves requests up to $200',
          slaHours: lvl.slaHours,
          autoEscalate: lvl.autoEscalate,
          condition: lvl.condition,
        };
      }
      return lvl;
    });

    rule.levels = updatedLevels;
    return rule.save();
  }

  async getQueue(): Promise<any[]> {
    return this.expensesService.findPending();
  }

  async approve(expenseId: string, comment?: string): Promise<any> {
    const expense = await this.expensesService.findById(expenseId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const rule = await this.workflowRuleModel.findOne({ name: 'Standard Approval Workflow' }).exec();
    const levels = rule ? rule.levels : [];

    // Determine applicable levels for this expense
    const amount = expense.convertedAmount || expense.amount || 0;
    const category = (expense.categoryId || '').toLowerCase();

    const applicableLevels = levels.filter((lvl) => {
      if (lvl.level === 1) return true; // Level 1 always required
      if (lvl.level === 2) {
        // Value > Level 1 Limit OR Category = Hardware OR Category = Travel
        const limit1 = levels.find((l) => l.level === 1)?.limit || 5000;
        return amount > limit1 || category.includes('hardware') || category.includes('travel') || category.includes('airfare');
      }
      if (lvl.level === 3) {
        // Value > 50000
        return amount > 50000;
      }
      return false;
    });

    const currentLevelNum = expense.approvalLevel || 0;
    
    // Find the next applicable level after currentLevelNum
    const nextLvlIndex = applicableLevels.findIndex((lvl) => lvl.level > currentLevelNum);

    if (nextLvlIndex !== -1) {
      const nextLevel = applicableLevels[nextLvlIndex];
      // Check if there are further levels after this one
      const hasFurtherLevels = applicableLevels.some((lvl) => lvl.level > nextLevel.level);

      if (hasFurtherLevels) {
        // Advance to nextLevel but status remains pending
        await this.expensesService.update(expenseId, { 
          approvalLevel: nextLevel.level 
        });
        return {
          next_approver: nextLevel.name,
          status: 'pending_approval',
          currentLevel: nextLevel.level,
        };
      } else {
        // No further levels, mark fully approved!
        await this.expensesService.update(expenseId, { 
          status: 'approved',
          approvalLevel: nextLevel.level
        });
        return {
          next_approver: null,
          status: 'approved',
          currentLevel: nextLevel.level,
        };
      }
    } else {
      // Already approved at all levels, or no applicable levels
      await this.expensesService.update(expenseId, { status: 'approved' });
      return {
        next_approver: null,
        status: 'approved',
        currentLevel: currentLevelNum,
      };
    }
  }

  async reject(expenseId: string, reason: string): Promise<any> {
    const expense = await this.expensesService.findById(expenseId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    await this.expensesService.update(expenseId, { status: 'rejected', violationReason: reason });
    return {};
  }

  async requestInfo(expenseId: string, message: string): Promise<any> {
    const expense = await this.expensesService.findById(expenseId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    await this.expensesService.update(expenseId, { status: 'info_requested', violationReason: message });
    return {};
  }
}
