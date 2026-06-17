import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Query, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new expense' })
  async create(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any, @Request() req: any) {
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
    const expense = await this.expensesService.create(createExpenseDto, user.userId, idempotencyKey);
    return {
      status: 201,
      data: {
        expense_id: expense._id,
        policy_violation: expense.policyViolation,
        violation_reason: expense.violationReason,
      },
      message: 'Expense submitted',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get expenses for current user or all pending if manager/finance' })
  async findAll(
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: any,
  ) {
    let expenses = [];
    if (['manager', 'finance', 'auditor', 'admin'].includes(user.role)) {
      expenses = await this.expensesService.findAll();
    } else {
      expenses = await this.expensesService.findByUserId(user.userId);
    }

    if (status) {
      expenses = expenses.filter(e => e.status === status);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const total = expenses.length;
    const paginatedExpenses = expenses.slice(startIndex, endIndex);

    return {
      status: 200,
      data: {
        expenses: paginatedExpenses.map(e => ({
          id: e._id,
          amount: e.amount,
          currency: e.currency,
          category_id: e.categoryId,
          cost_center_id: e.costCenterId,
          date: e.date,
          description: e.description,
          receipt_url: e.receiptUrl,
          status: e.status,
          policy_violation: e.policyViolation,
          violation_reason: e.violationReason,
          converted_amount: e.convertedAmount,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
      message: 'Expenses fetched',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single expense details' })
  async findOne(@Param('id') id: string) {
    const expense = await this.expensesService.findById(id);
    return {
      status: 200,
      data: { expense },
      message: 'Expense fetched',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense details' })
  async update(@Param('id') id: string, @Body() updates: any) {
    await this.expensesService.update(id, updates);
    return {
      status: 200,
      data: {},
      message: 'Expense updated',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  async delete(@Param('id') id: string) {
    await this.expensesService.delete(id);
    return {
      status: 200,
      data: {},
      message: 'Expense deleted',
    };
  }

  @Post('receipt/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload receipt file and run OCR extraction' })
  async uploadReceipt(@UploadedFile() file: any) {
    // Generate a simulated upload URL and mock OCR extraction
    const originalName = file ? file.originalname : 'receipt.jpg';
    const mockUrl = `https://storage.googleapis.com/receipts/${Date.now()}_${originalName}`;
    
    // Simulate OCR delay and return high-fidelity data
    return {
      status: 200,
      data: {
        receipt_url: mockUrl,
        ocr_data: {
          amount: 125.50,
          date: new Date().toISOString().split('T')[0],
          vendor: 'Equinox Vendor LLC',
        },
      },
      message: 'Receipt uploaded',
    };
  }
}
