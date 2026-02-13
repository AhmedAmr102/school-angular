import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly currentUser$ = this.apiService.currentUser$;

  constructor(private apiService: ApiService) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.apiService.login(data);
  }

  register(data: RegisterRequest): Observable<void> {
    return this.apiService.register(data);
  }

  forgotPassword(email: string): Observable<void> {
    return this.apiService.forgotPassword(email);
  }

  logout(): void {
    this.apiService.logout();
  }

  isAuthenticated(): boolean {
    return this.apiService.isAuthenticated();
  }

  hasRole(role: string): boolean {
    return this.apiService.hasRole(role);
  }

  getCurrentUser(): User | null {
    return this.apiService.getCurrentUser();
  }
}
