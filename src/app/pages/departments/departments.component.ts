import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { DepartmentsService } from '../../services/departments.service';
import { DepartmentDialogComponent } from './department-dialog.component';
import type { Department } from '../../models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss'
})
export class DepartmentsComponent implements OnInit {
  allDepartments: Department[] = [];
  departments: Department[] = [];
  displayedColumns = ['name', 'description', 'head', 'status', 'actions'];
  private searchQuery = '';

  get missingHeadCount(): number {
    return this.departments.filter((dept) => !dept.headDepartmentId).length;
  }

  constructor(
    private departmentsService: DepartmentsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = (params.get('q') ?? '').trim().toLowerCase();
      this.applyFilter();
    });
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentsService.getDepartments().subscribe({
      next: (departments) => {
        this.allDepartments = departments;
        this.applyFilter();
      },
      error: () => {
        this.snackBar.open('Failed to load departments', 'Close', { duration: 3000 });
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Department created successfully', 'Close', { duration: 3000 });
        this.loadDepartments();
      }
    });
  }

  editDepartment(dept: Department): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '500px',
      data: dept
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Department updated successfully', 'Close', { duration: 3000 });
        this.loadDepartments();
      }
    });
  }

  deleteDepartment(dept: Department): void {
    if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
      this.departmentsService.deleteDepartment(dept.id).subscribe({
        next: () => {
          this.snackBar.open('Department deleted successfully', 'Close', { duration: 3000 });
          this.loadDepartments();
        },
        error: () => {
          this.snackBar.open('Failed to delete department', 'Close', { duration: 3000 });
        }
      });
    }
  }

  private applyFilter(): void {
    if (!this.searchQuery) {
      this.departments = [...this.allDepartments];
      return;
    }

    this.departments = this.allDepartments.filter((department) =>
      [department.name, department.description, department.headDepartmentName, department.headDepartmentId]
        .some((value) => (value ?? '').toLowerCase().includes(this.searchQuery))
    );
  }
}
