import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { Notification } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  constructor(private apiService: ApiService) {}

  getNotifications(): Observable<Notification[]> {
    return this.apiService.getNotifications();
  }
}
