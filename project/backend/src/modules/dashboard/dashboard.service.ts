import { Injectable } from '@nestjs/common';
import { ExpensesService } from '../expenses/expenses.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly usersService: UsersService,
  ) {}

  async getEmployeeMetrics(userId: string): Promise<any> {
    const list = await this.expensesService.findByUserId(userId);
    const approved = list.filter(e => e.status === 'approved');
    const pending = list.filter(e => e.status === 'pending_approval');

    const totalSpent = approved.reduce((sum, e) => sum + e.convertedAmount, 0);
    const totalPending = pending.reduce((sum, e) => sum + e.convertedAmount, 0);
    const policyFlags = list.filter(
      e => e.policyViolation && e.status !== 'approved' && e.status !== 'rejected',
    ).length;

    const recentSubmissions = list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(e => ({
        id: e._id,
        date: e.date,
        description: e.description,
        amount: e.amount,
        currency: e.currency,
        convertedAmount: e.convertedAmount,
        categoryId: e.categoryId,
        status: e.status,
        policyViolation: e.policyViolation,
        violationReason: e.violationReason,
      }));

    return {
      total_spent: totalSpent,
      total_pending: totalPending,
      pending_count: pending.length,
      policy_flags: policyFlags,
      recent_submissions: recentSubmissions,
    };
  }

  async getManagerMetrics(managerId: string, role: string): Promise<any> {
    let list = [];
    if (role === 'admin' || role === 'finance' || role === 'auditor') {
      list = await this.expensesService.findAll();
    } else {
      const reports = await this.usersService.findByManagerId(managerId);
      const reportIds = reports.map(u => u._id.toString());
      list = await this.expensesService.findByUserIds(reportIds);
    }

    const totalSpent = list.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.convertedAmount, 0);
    const pendingCount = list.filter(e => e.status === 'pending_approval').length;
    const policyViolationsCount = list.filter(e => e.policyViolation).length;

    const users = await this.usersService.findAll();
    const userMap = new Map(
      users.map(u => [u._id.toString(), { name: u.name, email: u.email, department: u.department }]),
    );

    const recentSubmissions = list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(e => ({
        id: e._id,
        date: e.date,
        description: e.description,
        amount: e.amount,
        currency: e.currency,
        convertedAmount: e.convertedAmount,
        categoryId: e.categoryId,
        status: e.status,
        policyViolation: e.policyViolation,
        violationReason: e.violationReason,
        userName: userMap.get(e.userId)?.name || 'Employee User',
        userEmail: userMap.get(e.userId)?.email || '',
        department: userMap.get(e.userId)?.department || '',
      }));

    return {
      team_spent: totalSpent,
      pending_approvals: pendingCount,
      violations_flagged: policyViolationsCount,
      active_claims: list.length,
      recent_submissions: recentSubmissions,
    };
  }
}

