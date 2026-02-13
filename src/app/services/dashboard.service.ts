import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface TeacherDashboardStats {
  totalAssignedCourses: number;
  totalStudents: number;
  totalAssignments: number;
}

interface StudentDashboardStats {
  totalEnrolledCourses: number;
  totalEnrolledClasses: number;
  gpa: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private apiService: ApiService) {}

  getAdminTotalStudents(): Observable<number> {
    return this.apiService.getAdminTotalStudents();
  }

  getAdminTotalTeachers(): Observable<number> {
    return this.apiService.getAdminTotalTeachers();
  }

  getAdminTotalDepartments(): Observable<number> {
    return this.apiService.getAdminTotalDepartments();
  }

  getAdminTotalCourses(): Observable<number> {
    return this.apiService.getAdminTotalCourses();
  }

  getAdminTotalClasses(): Observable<number> {
    return this.apiService.getAdminTotalClasses();
  }

  getTeacherDashboardStats(): Observable<TeacherDashboardStats> {
    return this.apiService.getTeacherDashboardStats();
  }

  getStudentDashboardStats(): Observable<StudentDashboardStats> {
    return this.apiService.getStudentDashboardStats();
  }
}
