import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type {
  Class,
  ClassSubjectSetup,
  ClassSubjectSetupDraft,
  CreateClassRequest,
  UpdateClassAcademicSetupRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  constructor(private apiService: ApiService) {}

  getClasses(): Observable<Class[]> {
    return this.apiService.getClasses();
  }

  getClass(id: number): Observable<Class> {
    return this.apiService.getClass(id);
  }

  createClass(data: CreateClassRequest): Observable<void> {
    return this.apiService.createClass(data);
  }

  updateClass(id: number, data: CreateClassRequest): Observable<void> {
    return this.apiService.updateClass(id, data);
  }

  deleteClass(id: number): Observable<void> {
    return this.apiService.deleteClass(id);
  }

  updateClassStudents(classId: number, studentIds: string[]): Observable<void> {
    return this.apiService.updateClassStudents(classId, studentIds);
  }

  getClassStudents(classId: number): Observable<{ studentId: string; studentName: string }[]> {
    return this.apiService.getClassStudents(classId);
  }

  updateClassAcademicSetup(classId: number, data: UpdateClassAcademicSetupRequest): Observable<void> {
    return this.apiService.updateClassAcademicSetup(classId, data);
  }

  getClassSubjectSetupsForClass(classId: number): Observable<ClassSubjectSetup[]> {
    return this.apiService.getClassSubjectSetupsForClass(classId);
  }

  getClassSubjectSetups(): Observable<ClassSubjectSetup[]> {
    return this.apiService.getClassSubjectSetups();
  }

  saveClassSubjectSetups(classId: number, drafts: ClassSubjectSetupDraft[]): Observable<void> {
    return this.apiService.saveClassSubjectSetups(classId, drafts);
  }

  updateStudentEnrollmentInClass(classId: number, studentId: string, courseIds: number[]): Observable<void> {
    return this.apiService.updateStudentEnrollmentInClass(classId, studentId, courseIds);
  }
}
