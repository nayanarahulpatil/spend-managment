import { Injectable } from '@nestjs/common';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class DashboardService {
  constructor(private readonly expensesService: ExpensesService) {}

  async getEmployeeMetrics(userId: string): Promise<any> {
    const list = await this.expensesService.findByUserId(userId);
    const approved = list.filter(e => e.status === 'approved');
    const pending = list.filter(e => e.status === 'pending_approval');
    const rejected = list.filter(e => e.status === 'rejected');

    const totalSpent = approved.reduce((sum, e) => sum + e.convertedAmount, 0);
    const totalPending = pending.reduce((sum, e) => sum + e.convertedAmount, 0);

    return {
      total_spent: totalSpent,
      total_pending: totalPending,
      expense_count: list.length,
      history: list.slice(-5), // last 5
    };
  }

  async getManagerMetrics(): Promise<any> {
    const list = await this.expensesService.findAll();
    const totalSpent = list.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.convertedAmount, 0);
    const pendingCount = list.filter(e => e.status === 'pending_approval').length;
    const policyViolationsCount = list.filter(e => e.policyViolation).length;

    return {
      team_spent: totalSpent,
      pending_approvals: pendingCount,
      violations_flagged: policyViolationsCount,
      active_claims: list.length,
    };
  }
}
