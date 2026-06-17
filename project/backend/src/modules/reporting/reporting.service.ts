import { Injectable } from '@nestjs/common';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class ReportingService {
  constructor(private readonly expensesService: ExpensesService) {}

  async generateReport(type: string, filters: any): Promise<any[]> {
    const expenses = await this.expensesService.findAll();
    return expenses.filter(e => {
      if (type === 'violations' && !e.policyViolation) return false;
      if (filters.category_id && e.categoryId !== filters.category_id) return false;
      if (filters.employee_id && e.userId !== filters.employee_id) return false;
      return true;
    });
  }

  async getAuditLogs(): Promise<any[]> {
    return [
      { id: 'log-1', entity: 'expense', action: 'create', actor: 'employee@company.com', timestamp: new Date(), message: 'Expense for Travel created.' },
      { id: 'log-2', entity: 'expense', action: 'approve', actor: 'manager@company.com', timestamp: new Date(), message: 'Expense approved at Manager level.' },
    ];
  }
}
