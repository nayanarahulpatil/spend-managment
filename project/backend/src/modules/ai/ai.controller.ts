import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('categorize')
  @ApiOperation({ summary: 'Predict expense category based on description/amount/vendor' })
  async categorize(@Body() payload: { description: string; amount: number; vendor: string }) {
    const result = await this.aiService.categorize(payload.description, payload.amount, payload.vendor);
    return {
      status: 200,
      data: result,
      message: 'Category suggested',
    };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with the AI policy assistant' })
  async chat(@Body() payload: { message: string; session_id?: string }) {
    const result = await this.aiService.chat(payload.message, payload.session_id);
    return {
      status: 200,
      data: result,
      message: 'Response generated',
    };
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get list of detected anomalies/outliers' })
  async getAnomalies(@Query('employee_id') employeeId?: string) {
    const list = await this.aiService.getAnomalies(employeeId);
    return {
      status: 200,
      data: { anomalies: list },
      message: 'Anomalies fetched',
    };
  }
}
