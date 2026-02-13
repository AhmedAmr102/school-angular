import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type { Course, CreateCourseRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  constructor(private apiService: ApiService) {}

  getCourses(): Observable<Course[]> {
    return this.apiService.getCourses();
  }

  getCourse(id: number): Observable<Course> {
    return this.apiService.getCourse(id);
  }

  createCourse(data: CreateCourseRequest): Observable<void> {
    return this.apiService.createCourse(data);
  }

  updateCourse(id: number, data: CreateCourseRequest): Observable<void> {
    return this.apiService.updateCourse(id, data);
  }

  deleteCourse(id: number): Observable<void> {
    return this.apiService.deleteCourse(id);
  }

  getManageableCourses(): Observable<Course[]> {
    return this.apiService.getManageableCourses();
  }
}
