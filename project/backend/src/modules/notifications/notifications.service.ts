import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private notifications = [
    { id: 'n1', title: 'Expense Submitted', message: 'Your expense for Travel has been submitted successfully.', read: false, date: new Date() },
    { id: 'n2', title: 'Policy Violation Flagged', message: 'Your expense for Meals exceeds the $50 limit.', read: false, date: new Date() },
  ];

  async findAll(): Promise<any[]> {
    return this.notifications;
  }

  async markAsRead(id: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === id);
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    notif.read = true;
  }
}
