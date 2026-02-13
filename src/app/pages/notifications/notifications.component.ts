import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationsService } from '../../services/notifications.service';
import { Notification, NotificationType } from '../../models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatBadgeModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  constructor(private notificationsService: NotificationsService, private snackBar: MatSnackBar) {}
  ngOnInit(): void { this.loadNotifications(); }
  loadNotifications(): void {
    this.notificationsService.getNotifications().subscribe({
      next: (notifications) => this.notifications = notifications,
      error: () => this.snackBar.open('Failed to load notifications', 'Close', { duration: 3000 })
    });
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((notification) => ({ ...notification, isRead: true }));
    this.snackBar.open('All notifications marked as read.', 'Close', { duration: 2500 });
  }

  getIcon(type: NotificationType): string {
    switch(type) {
      case NotificationType.Assignment: return 'assignment';
      case NotificationType.Grade: return 'grade';
      case NotificationType.Class: return 'class';
      default: return 'notifications';
    }
  }
}
