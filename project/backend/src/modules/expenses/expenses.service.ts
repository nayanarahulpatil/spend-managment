import { Injectable, ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from './schemas/expense.schema';
import { CreateExpenseDto } from './dto/create-expense.dto';
import * as crypto from 'crypto';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private expenseModel: Model<Expense>) {}

  // Mock FX Rates
  private getFxRate(currency: string): number {
    const rates: Record<string, number> = {
      USD: 1.0,
      EUR: 1.08,
      GBP: 1.27,
      INR: 0.012,
      JPY: 0.0064,
    };
    return rates[currency.toUpperCase()] || 1.0;
  }

  // Policy Engine
  private runPolicyCheck(categoryId: string, amountInUsd: number, costCenterId: string): { violation: boolean; reason: string | null } {
    // Marketing meals & coffee limit is $15.00 (MKT-22)
    if (categoryId.toLowerCase() === 'meals' && (costCenterId === 'CC-102' || costCenterId === 'MKT-400') && amountInUsd > 15.00) {
      return {
        violation: true,
        reason: `Marketing meal expense of $${amountInUsd.toFixed(2)} exceeds breakfast/coffee limit of $15.00 (MKT-22)`,
      };
    }

    const limits: Record<string, number> = {
      meals: 50,
      travel: 500,
      entertainment: 150,
      office: 200,
    };

    const limit = limits[categoryId.toLowerCase()];
    if (limit !== undefined && amountInUsd > limit) {
      return {
        violation: true,
        reason: `${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)} expense of $${amountInUsd.toFixed(2)} exceeds limit of $${limit.toFixed(2)}`,
      };
    }

    return { violation: false, reason: null };
  }

  async create(createExpenseDto: CreateExpenseDto, userId: string, idempotencyKey?: string): Promise<Expense> {
    const { amount, currency, category_id, receipt_url } = createExpenseDto;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.expenseModel.findOne({ idempotencyKey }).exec();
      if (existing) {
        return existing;
      }
    }

    // Currency Conversion
    const rate = this.getFxRate(currency);
    const convertedAmount = amount * rate;

    // Receipt threshold check: above $25 requires a receipt
    if (convertedAmount > 25 && (!receipt_url || receipt_url.trim() === '')) {
      throw new UnprocessableEntityException('Receipt is required for expenses exceeding $25.');
    }

    // Duplicate detection based on receipt URL/hash (only if receipt is present)
    let hash = null;
    if (receipt_url && receipt_url.trim() !== '') {
      hash = crypto.createHash('md5').update(receipt_url).digest('hex');
      const existing = await this.expenseModel.findOne({ receiptHash: hash }).exec();
      if (existing) {
        throw new ConflictException('Duplicate receipt detected.');
      }
    }

    // Policy Rule Evaluation
    const policy = this.runPolicyCheck(category_id, convertedAmount, createExpenseDto.cost_center_id);

    const createdExpense = new this.expenseModel({
      amount,
      currency: currency.toUpperCase(),
      categoryId: category_id,
      costCenterId: createExpenseDto.cost_center_id,
      date: new Date(createExpenseDto.date),
      description: createExpenseDto.description,
      receiptUrl: receipt_url || '',
      userId,
      status: 'pending_approval',
      policyViolation: policy.violation,
      violationReason: policy.reason,
      convertedAmount,
      receiptHash: hash,
      idempotencyKey: idempotencyKey || null,
      ocrData: {
        amount,
        date: createExpenseDto.date,
        vendor: 'Equinox Vendor',
      },
    });

    return createdExpense.save();
  }

  async findByUserId(userId: string): Promise<Expense[]> {
    return this.expenseModel.find({ userId }).exec();
  }

  async findById(id: string): Promise<Expense> {
    const expense = await this.expenseModel.findById(id).exec();
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async update(id: string, updates: Partial<Expense>): Promise<Expense> {
    const expense = await this.expenseModel.findByIdAndUpdate(id, updates, { new: true }).exec();
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async delete(id: string): Promise<void> {
    const result = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Expense not found');
    }
  }

  async findPending(): Promise<Expense[]> {
    return this.expenseModel.find({ status: 'pending_approval' }).exec();
  }

  async findAll(): Promise<Expense[]> {
    return this.expenseModel.find().exec();
  }

  async findByUserIds(userIds: string[]): Promise<Expense[]> {
    return this.expenseModel.find({ userId: { $in: userIds } }).exec();
  }
}

