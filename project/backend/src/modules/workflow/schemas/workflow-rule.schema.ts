import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class WorkflowLevel {
  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: 5000 })
  limit: number;

  @Prop({ required: true, default: 48 })
  slaHours: number;

  @Prop({ required: true, default: true })
  autoEscalate: boolean;

  @Prop({ default: null })
  condition: string;
}

@Schema({ timestamps: true })
export class WorkflowRule extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ type: [WorkflowLevel], default: [] })
  levels: WorkflowLevel[];
}

export const WorkflowRuleSchema = SchemaFactory.createForClass(WorkflowRule);
