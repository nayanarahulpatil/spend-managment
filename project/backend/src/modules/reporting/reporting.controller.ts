import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reporting & Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Post('api/v1/reports/generate')
  @Roles('finance', 'admin', 'auditor')
  @ApiOperation({ summary: 'Generate custom spend/violation reports' })
  async generateReport(@Body() payload: { type: string; filters?: any }) {
    const records = await this.reportingService.generateReport(payload.type, payload.filters || {});
    return {
      status: 200,
      data: {
        report_url: 'https://storage.googleapis.com/reports/report_' + Date.now() + '.pdf',
        records: records.map(r => ({
          id: r._id,
          amount: r.amount,
          currency: r.currency,
          category_id: r.categoryId,
          status: r.status,
          policy_violation: r.policyViolation,
          violation_reason: r.violationReason,
        })),
      },
      message: 'Report generated',
    };
  }

  @Get('api/v1/audit/logs')
  @Roles('auditor', 'admin')
  @ApiOperation({ summary: 'Retrieve immutable system audit logs' })
  async getAuditLogs() {
    const logs = await this.reportingService.getAuditLogs();
    return {
      status: 200,
      data: {
        logs,
        total: logs.length,
      },
      message: 'Audit logs fetched',
    };
  }
}
