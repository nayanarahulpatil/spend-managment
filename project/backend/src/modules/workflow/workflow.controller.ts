import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('queue')
  @Roles('manager', 'finance', 'admin')
  @ApiOperation({ summary: 'Fetch the pending approvals queue' })
  async getQueue() {
    const queue = await this.workflowService.getQueue();
    return {
      status: 200,
      data: { pending_approvals: queue },
      message: 'Queue fetched',
    };
  }

  @Post('expenses/:id/approve')
  @Roles('manager', 'finance', 'admin')
  @ApiOperation({ summary: 'Approve an expense' })
  async approve(@Param('id') id: string, @Body('comment') comment?: string) {
    const result = await this.workflowService.approve(id, comment);
    return {
      status: 200,
      data: result,
      message: 'Expense approved',
    };
  }

  @Post('expenses/:id/reject')
  @Roles('manager', 'finance', 'admin')
  @ApiOperation({ summary: 'Reject an expense' })
  async reject(@Param('id') id: string, @Body('reason') reason: string) {
    const result = await this.workflowService.reject(id, reason);
    return {
      status: 200,
      data: result,
      message: 'Expense rejected',
    };
  }

  @Post('expenses/:id/request-info')
  @Roles('manager', 'finance', 'admin')
  @ApiOperation({ summary: 'Request more info for an expense' })
  async requestInfo(@Param('id') id: string, @Body('message') message: string) {
    const result = await this.workflowService.requestInfo(id, message);
    return {
      status: 200,
      data: result,
      message: 'Information requested',
    };
  }

  @Get('rules')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Fetch the active workflow rules configuration' })
  async getRules() {
    const rules = await this.workflowService.getRules();
    return {
      status: 200,
      data: rules,
      message: 'Workflow rules fetched',
    };
  }

  @Post('rules')
  @Roles('admin')
  @ApiOperation({ summary: 'Update workflow rules levels' })
  async updateRules(@Body('levels') levels: any[]) {
    const rules = await this.workflowService.updateRules(levels);
    return {
      status: 200,
      data: rules,
      message: 'Workflow rules updated successfully',
    };
  }

  @Post('rules/apply-ai')
  @Roles('admin')
  @ApiOperation({ summary: 'Apply AI-assisted workflow policy recommendations' })
  async applyAiRecommendations() {
    const rules = await this.workflowService.applyAiRecommendations();
    return {
      status: 200,
      data: rules,
      message: 'AI recommendations applied successfully',
    };
  }
}
