import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { Attendance, CreateAttendanceRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private apiService: ApiService) {}

  createAttendance(data: CreateAttendanceRequest): Observable<void> {
    return this.apiService.createAttendance(data);
  }

  getClassAttendance(classId: number): Observable<Attendance[]> {
    return this.apiService.getClassAttendance(classId);
  }

  getStudentAttendance(): Observable<Attendance[]> {
    return this.apiService.getStudentAttendance();
  }
}
