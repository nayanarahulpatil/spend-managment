import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('employee')
  @ApiOperation({ summary: 'Retrieve personal spend and claims summary' })
  async getEmployeeDashboard(@CurrentUser() user: any) {
    const stats = await this.dashboardService.getEmployeeMetrics(user.userId);
    return {
      status: 200,
      data: stats,
      message: 'Employee stats fetched',
    };
  }

  @Get('manager')
  @Roles('manager', 'finance', 'admin')
  @ApiOperation({ summary: 'Retrieve manager dashboard stats' })
  async getManagerDashboard() {
    const stats = await this.dashboardService.getManagerMetrics();
    return {
      status: 200,
      data: stats,
      message: 'Manager stats fetched',
    };
  }
}
