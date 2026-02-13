import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private apiService: ApiService) {}

  getUsers(role?: 'Admin' | 'Teacher' | 'Student'): Observable<User[]> {
    return this.apiService.getUsers(role);
  }

  activateUser(userId: string): Observable<void> {
    return this.apiService.activateUser(userId);
  }

  deactivateUser(userId: string): Observable<void> {
    return this.apiService.deactivateUser(userId);
  }

  deleteUser(userId: string): Observable<void> {
    return this.apiService.deleteUser(userId);
  }
}
