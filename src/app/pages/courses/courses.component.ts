import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CoursesService } from '../../services/courses.service';
import { ClassesService } from '../../services/classes.service';
import { CourseDialogComponent } from './course-dialog.component';
import type { ClassSubjectSetup, Course } from '../../models';

@Component({
  selector: 'app-courses',
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
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss'
})
export class CoursesComponent implements OnInit {
  allCourses: Course[] = [];
  courses: Course[] = [];
  displayedColumns = ['code', 'name', 'credits', 'department', 'teachers', 'classes', 'status', 'actions'];
  private searchQuery = '';
  private teacherNamesByCourseId = new Map<number, string>();
  private classCountByCourseId = new Map<number, number>();

  constructor(
    private coursesService: CoursesService,
    private classesService: ClassesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) { }
  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = (params.get('q') ?? '').trim().toLowerCase();
      this.applyFilter();
    });
    this.loadCourses();
  }
  loadCourses(): void {
    forkJoin({
      courses: this.coursesService.getCourses(),
      setups: this.classesService.getClassSubjectSetups()
    }).subscribe({
      next: ({ courses, setups }) => {
        this.allCourses = courses;
        this.buildCourseTeachingMap(setups);
        this.applyFilter();
      },
      error: () => this.snackBar.open('Failed to load courses', 'Close', { duration: 3000 })
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '560px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Course created successfully', 'Close', { duration: 3000 });
        this.loadCourses();
      }
    });
  }

  editCourse(course: Course): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '560px',
      data: course
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Course updated successfully', 'Close', { duration: 3000 });
        this.loadCourses();
      }
    });
  }

  deleteCourse(course: Course): void {
    if (!confirm(`Are you sure you want to delete ${course.name}?`)) {
      return;
    }

    this.coursesService.deleteCourse(course.id).subscribe({
      next: () => {
        this.snackBar.open('Course deleted successfully', 'Close', { duration: 3000 });
        this.loadCourses();
      },
      error: () => this.snackBar.open('Failed to delete course', 'Close', { duration: 3000 })
    });
  }

  getTeachersLabel(courseId: number): string {
    return this.teacherNamesByCourseId.get(courseId) || 'Not Assigned';
  }

  getClassesLabel(courseId: number): string {
    const count = this.classCountByCourseId.get(courseId) ?? 0;
    if (count === 0) {
      return 'No Classes';
    }
    if (count === 1) {
      return '1 Class';
    }
    return `${count} Classes`;
  }

  private buildCourseTeachingMap(setups: ClassSubjectSetup[]): void {
    this.teacherNamesByCourseId.clear();
    this.classCountByCourseId.clear();

    const teacherSetByCourseId = new Map<number, Set<string>>();
    const classSetByCourseId = new Map<number, Set<number>>();

    for (const setup of setups) {
      const teacherSet = teacherSetByCourseId.get(setup.courseId) ?? new Set<string>();
      setup.teacherNames.forEach((teacherName) => {
        if (teacherName) {
          teacherSet.add(teacherName);
        }
      });
      teacherSetByCourseId.set(setup.courseId, teacherSet);

      const classSet = classSetByCourseId.get(setup.courseId) ?? new Set<number>();
      classSet.add(setup.classId);
      classSetByCourseId.set(setup.courseId, classSet);
    }

    for (const [courseId, teacherSet] of teacherSetByCourseId.entries()) {
      this.teacherNamesByCourseId.set(courseId, Array.from(teacherSet).join(', '));
    }
    for (const [courseId, classSet] of classSetByCourseId.entries()) {
      this.classCountByCourseId.set(courseId, classSet.size);
    }
  }

  private applyFilter(): void {
    if (!this.searchQuery) {
      this.courses = [...this.allCourses];
      return;
    }

    const query = this.searchQuery;
    this.courses = this.allCourses.filter((course) => {
      const searchable = [
        String(course.id),
        course.code,
        course.name,
        course.departmentName,
        this.getTeachersLabel(course.id),
        this.getClassesLabel(course.id)
      ].join(' ').toLowerCase();

      return searchable.includes(query);
    });
  }
}
