import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['employee', 'manager', 'finance', 'admin', 'auditor'] })
  role: string;

  @Prop({ default: false })
  mfaEnabled: boolean;

  @Prop()
  mfaSecret: string;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ default: null })
  lockedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 'Engineering' })
  department: string;

  @Prop({ default: 'CC-101', index: true })
  costCenter: string;

  @Prop({ default: null })
  managerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
