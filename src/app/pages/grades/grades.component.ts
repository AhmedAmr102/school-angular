import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AssignmentsService } from '../../services/assignments.service';
import type { AssignmentSubmission } from '../../models';
    
@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatChipsModule, MatProgressBarModule, MatSnackBarModule],
  templateUrl: './grades.component.html',
  styleUrl: './grades.component.scss'
})
export class GradesComponent implements OnInit {
  grades: AssignmentSubmission[] = [];
  displayedColumns = ['assignment', 'submitted', 'grade', 'remarks'];
  constructor(private assignmentsService: AssignmentsService, private snackBar: MatSnackBar) {}
  ngOnInit(): void { this.loadGrades(); }
  loadGrades(): void {
    this.assignmentsService.getStudentGrades().subscribe({
      next: (grades) => this.grades = grades,
      error: () => this.snackBar.open('Failed to load grades', 'Close', { duration: 3000 })
    });
  }
  getGradeColor(grade?: number): ThemePalette {
    if (!grade) return 'warn';
    if (grade >= 90) return 'primary';
    if (grade >= 70) return 'accent';
    return 'warn';
  }
}
