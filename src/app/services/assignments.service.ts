import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import type {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentRequest,
  GradeAssignmentRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AssignmentsService {
  constructor(private apiService: ApiService) {}

  getAssignments(): Observable<Assignment[]> {
    return this.apiService.getAssignments();
  }

  getStudentAssignments(): Observable<Assignment[]> {
    return this.apiService.getStudentAssignments();
  }

  createAssignment(data: CreateAssignmentRequest): Observable<void> {
    return this.apiService.createAssignment(data);
  }

  getAssignmentStudentsForGrading(assignmentId: number): Observable<AssignmentSubmission[]> {
    return this.apiService.getAssignmentStudentsForGrading(assignmentId);
  }

  gradeAssignment(assignmentId: number, data: GradeAssignmentRequest): Observable<void> {
    return this.apiService.gradeAssignment(assignmentId, data);
  }

  submitAssignment(assignmentId: number, file: File): Observable<void> {
    return this.apiService.submitAssignment(assignmentId, file);
  }

  getStudentGrades(): Observable<AssignmentSubmission[]> {
    return this.apiService.getStudentGrades();
  }
}
