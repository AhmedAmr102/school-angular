import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AssignmentsService } from '../../services/assignments.service';
import { AuthService } from '../../services/auth.service';
import type { Assignment } from '../../models';
import { AssignmentDialogComponent } from './assignment-dialog.component';
import { AssignmentGradeDialogComponent } from './assignment-grade-dialog.component';
import { AssignmentSubmitDialogComponent } from './assignment-submit-dialog.component';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatTooltipModule, MatDialogModule],
  templateUrl: './assignments.component.html',
  styleUrl: './assignments.component.scss'
})
export class AssignmentsComponent implements OnInit {
  allAssignments: Assignment[] = [];
  assignments: Assignment[] = [];
  displayedColumns = ['title', 'class', 'dueDate', 'status', 'actions'];
  isLoading = false;
  private searchQuery = '';

  constructor(
    public authService: AuthService,
    private assignmentsService: AssignmentsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = (params.get('q') ?? '').trim().toLowerCase();
      this.applyFilter();
    });
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.isLoading = true;

    const observable = (this.authService.hasRole('Teacher') || this.authService.hasRole('Admin'))
      ? this.assignmentsService.getAssignments()
      : this.assignmentsService.getStudentAssignments();
    observable.subscribe({
      next: (assignments) => {
        this.allAssignments = assignments;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load assignments', 'Close', { duration: 3000 });
      }
    });
  }

  openCreateAssignment(): void {
    const dialogRef = this.dialog.open(AssignmentDialogComponent, {
      width: '620px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Assignment created successfully.', 'Close', { duration: 2500 });
        this.loadAssignments();
      }
    });
  }

  submitAssignment(assignment: Assignment): void {
    const dialogRef = this.dialog.open(AssignmentSubmitDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: assignment
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Assignment submitted successfully.', 'Close', { duration: 2500 });
      }
    });
  }

  editAssignment(assignment: Assignment): void {
    const dialogRef = this.dialog.open(AssignmentGradeDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: assignment
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Grade saved successfully.', 'Close', { duration: 2500 });
        this.loadAssignments();
      }
    });
  }

  isOverdue(dueDate: string): boolean { return new Date(dueDate) < new Date(); }

  private applyFilter(): void {
    if (!this.searchQuery) {
      this.assignments = [...this.allAssignments];
      return;
    }

    this.assignments = this.allAssignments.filter((assignment) => {
      const searchable = [
        String(assignment.id),
        assignment.title,
        assignment.className,
        assignment.courseName,
        assignment.teacherName,
        assignment.dueDate
      ].join(' ').toLowerCase();

      return searchable.includes(this.searchQuery);
    });
  }
}
