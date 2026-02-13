import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ClassesService } from '../../services/classes.service';
import { AuthService } from '../../services/auth.service';
import type { Class, ClassSubjectSetup } from '../../models';
import { ClassDialogComponent } from './class-dialog.component';
import { ClassStudentsDialogComponent } from './class-students-dialog.component';
import { ClassAcademicSetupDialogComponent } from './class-academic-setup-dialog.component';
import { ClassStudentEnrollmentDialogComponent } from './class-student-enrollment-dialog.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatTooltipModule, MatDialogModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss'
})
export class ClassesComponent implements OnInit {
  allClasses: Class[] = [];
  classes: Class[] = [];
  displayedColumns = ['name', 'department', 'semester', 'course', 'teacher', 'students', 'setup', 'status', 'actions'];
  isLoading = false;
  private searchQuery = '';
  private subjectSummaryByClassId = new Map<number, string>();
  private teacherSummaryByClassId = new Map<number, string>();
  private studentsCountByClassId = new Map<number, number>();
  private setupCountByClassId = new Map<number, number>();

  constructor(
    public authService: AuthService,
    private classesService: ClassesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = (params.get('q') ?? '').trim().toLowerCase();
      this.applyFilter();
    });
    this.loadClasses();
  }

  loadClasses(): void {
    this.isLoading = true;

    forkJoin({
      classes: this.classesService.getClasses(),
      setups: this.classesService.getClassSubjectSetups()
    }).subscribe({
      next: ({ classes, setups }) => {
        this.allClasses = classes;
        this.buildAcademicSummaryMap(classes, setups);
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load classes', 'Close', { duration: 3000 });
      }
    });
  }

  openAddClass(): void {
    const dialogRef = this.dialog.open(ClassDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Class created successfully.', 'Close', { duration: 2500 });
        this.loadClasses();
      }
    });
  }

  viewClass(classItem: Class): void {
    this.dialog.open(ClassStudentsDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: classItem
    });
  }

  editClass(classItem: Class): void {
    const dialogRef = this.dialog.open(ClassDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: classItem
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Class updated successfully.', 'Close', { duration: 2500 });
        this.loadClasses();
      }
    });
  }

  openAcademicSetup(classItem: Class): void {
    const dialogRef = this.dialog.open(ClassAcademicSetupDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: classItem
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Class academic setup updated successfully.', 'Close', { duration: 2500 });
        this.loadClasses();
      }
    });
  }

  openStudentEnrollment(classItem: Class): void {
    const dialogRef = this.dialog.open(ClassStudentEnrollmentDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: classItem
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Student subject enrollment updated successfully.', 'Close', { duration: 2500 });
        this.loadClasses();
      }
    });
  }

  deleteClass(classItem: Class): void {
    if (!confirm(`Delete class "${classItem.name}"?`)) {
      return;
    }

    this.classesService.deleteClass(classItem.id).subscribe({
      next: () => {
        this.snackBar.open('Class deleted successfully.', 'Close', { duration: 2500 });
        this.loadClasses();
      },
      error: () => this.snackBar.open('Failed to delete class', 'Close', { duration: 3000 })
    });
  }

  getSubjectsLabel(classItem: Class): string {
    return this.subjectSummaryByClassId.get(classItem.id) || classItem.courseName || 'Not Assigned';
  }

  getTeachersLabel(classItem: Class): string {
    return this.teacherSummaryByClassId.get(classItem.id) || classItem.teacherName || 'Not Assigned';
  }

  getStudentsCount(classItem: Class): number {
    return this.studentsCountByClassId.get(classItem.id) ?? (classItem.students?.length ?? classItem.studentCount ?? 0);
  }

  getSetupStatusLabel(classItem: Class): string {
    const count = this.setupCountByClassId.get(classItem.id) ?? 0;
    if (count === 0) {
      return 'No Subjects';
    }
    if (count === 1) {
      return '1 Subject';
    }
    return `${count} Subjects`;
  }

  private applyFilter(): void {
    if (!this.searchQuery) {
      this.classes = [...this.allClasses];
      return;
    }

    const query = this.searchQuery;
    this.classes = this.allClasses.filter((classItem) => {
      const searchable = [
        classItem.name,
        classItem.departmentName,
        String(classItem.semester),
        this.getSubjectsLabel(classItem),
        this.getTeachersLabel(classItem),
        this.getSetupStatusLabel(classItem),
        String(this.getStudentsCount(classItem))
      ].join(' ').toLowerCase();

      return searchable.includes(query);
    });
  }

  private buildAcademicSummaryMap(classes: Class[], setups: ClassSubjectSetup[]): void {
    this.subjectSummaryByClassId.clear();
    this.teacherSummaryByClassId.clear();
    this.studentsCountByClassId.clear();
    this.setupCountByClassId.clear();

    const setupsByClassId = new Map<number, ClassSubjectSetup[]>();
    for (const setup of setups) {
      const current = setupsByClassId.get(setup.classId) ?? [];
      current.push(setup);
      setupsByClassId.set(setup.classId, current);
    }

    for (const classItem of classes) {
      const classSetups = setupsByClassId.get(classItem.id) ?? [];
      const subjectNames = Array.from(new Set(classSetups.map((item) => item.courseName).filter((name) => !!name)));
      const teacherNames = Array.from(new Set(classSetups.flatMap((item) => item.teacherNames).filter((name) => !!name)));
      const studentIds = new Set(classSetups.flatMap((item) => item.studentIds).filter((id) => !!id));

      this.subjectSummaryByClassId.set(classItem.id, subjectNames.length > 0 ? subjectNames.join(', ') : '');
      this.teacherSummaryByClassId.set(classItem.id, teacherNames.length > 0 ? teacherNames.join(', ') : '');
      if (studentIds.size > 0) {
        this.studentsCountByClassId.set(classItem.id, studentIds.size);
      }
      this.setupCountByClassId.set(classItem.id, classSetups.length);
    }
  }
}
