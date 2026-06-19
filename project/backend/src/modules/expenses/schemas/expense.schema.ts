import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true })
  categoryId: string;

  @Prop({ required: true })
  costCenterId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  receiptUrl: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['pending_approval', 'approved', 'rejected', 'info_requested'], default: 'pending_approval' })
  status: string;

  @Prop({ default: false })
  policyViolation: boolean;

  @Prop({ default: null })
  violationReason: string;

  @Prop({ required: true })
  convertedAmount: number;

  @Prop({ type: Object, default: {} })
  ocrData: {
    amount?: number;
    date?: string;
    vendor?: string;
  };

  @Prop({ default: null, index: true })
  receiptHash: string;

  @Prop({ default: null, index: true })
  idempotencyKey: string;

  @Prop({ default: 0 })
  approvalLevel: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
