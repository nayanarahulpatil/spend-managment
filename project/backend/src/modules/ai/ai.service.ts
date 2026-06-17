import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('openaiApiKey');
    if (apiKey && apiKey !== 'mock-key') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async categorize(description: string, amount: number, vendor: string): Promise<any> {
    const descLower = description.toLowerCase();
    let suggested_category = 'office';
    let confidence = 0.95;

    if (descLower.includes('flight') || descLower.includes('hotel') || descLower.includes('cab') || descLower.includes('uber') || descLower.includes('taxi')) {
      suggested_category = 'travel';
    } else if (descLower.includes('lunch') || descLower.includes('dinner') || descLower.includes('food') || descLower.includes('restaurant') || descLower.includes('meal')) {
      suggested_category = 'meals';
    } else if (descLower.includes('client') || descLower.includes('party') || descLower.includes('movie') || descLower.includes('gift')) {
      suggested_category = 'entertainment';
    }

    return { suggested_category, confidence };
  }

  async chat(message: string, sessionId?: string): Promise<any> {
    const msgLower = message.toLowerCase();
    let reply = 'I am here to help you navigate our company expense policies. Please ask about limits, categories, or approval cycles.';

    if (msgLower.includes('limit') || msgLower.includes('how much')) {
      reply = 'Under current company policies, Meals are limited to $50 per receipt, Travel to $500, and Entertainment to $150. Any expense exceeding these thresholds will be automatically flagged for policy violation.';
    } else if (msgLower.includes('mfa') || msgLower.includes('login')) {
      reply = 'Multi-Factor Authentication (MFA) is mandatory for Admins, Finance, and Auditors. Employees can optionally enable MFA in settings.';
    } else if (msgLower.includes('policy') || msgLower.includes('rules')) {
      reply = 'Our expense policy requires high-fidelity receipt uploads for any purchase above $25. All expense claims must be submitted within 30 days of the transaction date.';
    }

    return {
      reply,
      session_id: sessionId || 'session-' + Date.now(),
    };
  }

  async getAnomalies(employeeId?: string): Promise<any[]> {
    return [
      { id: 'anom-1', type: 'Off-hours Claim', severity: 'medium', description: 'Expense claimed at 2:00 AM on Sunday.', amount: 85.0 },
      { id: 'anom-2', type: 'Duplicate Vendor', severity: 'high', description: 'Three duplicate transactions at "Uber" within 1 hour.', amount: 45.0 },
    ];
  }
}
