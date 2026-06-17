import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  async log(action: string, actorId: string, details: string): Promise<void> {
    console.log(`[AUDIT LOG] Action: ${action} | Actor: ${actorId} | Details: ${details}`);
  }
}
