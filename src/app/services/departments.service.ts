import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { CreateDepartmentRequest, Department } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {
  constructor(private apiService: ApiService) {}

  getDepartments(): Observable<Department[]> {
    return this.apiService.getDepartments();
  }

  getDepartment(id: number): Observable<Department> {
    return this.apiService.getDepartment(id);
  }

  createDepartment(data: CreateDepartmentRequest): Observable<void> {
    return this.apiService.createDepartment(data);
  }

  updateDepartment(id: number, data: CreateDepartmentRequest): Observable<void> {
    return this.apiService.updateDepartment(id, data);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.apiService.deleteDepartment(id);
  }
}
