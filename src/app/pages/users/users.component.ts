import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { ClassesService } from '../../services/classes.service';
import type { Class, ClassSubjectSetup, StudentAcademicOverview, User } from '../../models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatTabsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  allTeachers: User[] = [];
  allStudents: User[] = [];
  teachers: User[] = [];
  students: User[] = [];
  teacherDisplayedColumns = ['id', 'userName', 'name', 'email', 'status', 'actions'];
  studentDisplayedColumns = ['id', 'userName', 'name', 'email', 'semester', 'classes', 'subjects', 'teachers', 'status', 'actions'];
  inProgressUserId: string | null = null;
  isLoading = false;
  private searchQuery = '';
  private studentAcademicById = new Map<string, StudentAcademicOverview>();

  constructor(
    private usersService: UsersService,
    private classesService: ClassesService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = (params.get('q') ?? '').trim().toLowerCase();
      this.applyFilter();
    });
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    forkJoin({
      users: this.usersService.getUsers(),
      classes: this.classesService.getClasses(),
      setups: this.classesService.getClassSubjectSetups()
    }).subscribe({
      next: ({ users, classes, setups }) => {
        this.allTeachers = users.filter((user) => user.role === 'Teacher');
        this.allStudents = users.filter((user) => user.role === 'Student');
        this.studentAcademicById = this.buildStudentAcademicMap(classes, setups);
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  getStudentSemesterLabel(studentId: string): string {
    const semester = this.studentAcademicById.get(studentId)?.semester;
    return semester ? `Semester ${semester}` : 'Not Assigned';
  }

  getStudentSubjectsLabel(studentId: string): string {
    const subjects = this.studentAcademicById.get(studentId)?.courseNames ?? [];
    return subjects.length > 0 ? subjects.join(', ') : 'No Subjects';
  }

  getStudentTeachersLabel(studentId: string): string {
    const teachers = this.studentAcademicById.get(studentId)?.teacherNames ?? [];
    return teachers.length > 0 ? teachers.join(', ') : 'No Teachers';
  }

  getStudentClassesLabel(studentId: string): string {
    const classes = this.studentAcademicById.get(studentId)?.classNames ?? [];
    return classes.length > 0 ? classes.join(', ') : 'No Classes';
  }

  openCreateUser(): void {
    this.router.navigate(['/register']);
  }

  setUserActive(user: User, active: boolean): void {
    this.inProgressUserId = user.id;
    const operation = active
      ? this.usersService.activateUser(user.id)
      : this.usersService.deactivateUser(user.id);

    operation.subscribe({
      next: () => {
        this.inProgressUserId = null;
        this.snackBar.open(`User ${active ? 'activated' : 'deactivated'} successfully.`, 'Close', { duration: 2500 });
        this.loadUsers();
      },
      error: () => {
        this.inProgressUserId = null;
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete account "${user.userName}"?`)) {
      return;
    }

    this.inProgressUserId = user.id;
    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.inProgressUserId = null;
        this.snackBar.open('User deleted successfully.', 'Close', { duration: 2500 });
        this.loadUsers();
      },
      error: () => {
        this.inProgressUserId = null;
      }
    });
  }

  getStatusColor(isActive?: boolean): ThemePalette {
    return isActive ? 'primary' : 'warn';
  }

  getStatusLabel(isActive?: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  isBusy(user: User): boolean {
    return this.inProgressUserId === user.id;
  }

  private applyFilter(): void {
    if (!this.searchQuery) {
      this.teachers = [...this.allTeachers];
      this.students = [...this.allStudents];
      return;
    }

    const query = this.searchQuery;
    this.teachers = this.allTeachers.filter((user) => this.matchesUser(user, query));
    this.students = this.allStudents.filter((user) => this.matchesUser(user, query));
  }

  private matchesUser(user: User, query: string): boolean {
    return [user.id, user.userName, user.name, user.email]
      .some((value) => (value ?? '').toLowerCase().includes(query));
  }

  private buildStudentAcademicMap(classes: Class[], setups: ClassSubjectSetup[]): Map<string, StudentAcademicOverview> {
    const mapByStudent = new Map<string, StudentAcademicOverview>();

    for (const setup of setups) {
      const semesterValue = Number.isFinite(setup.semester) ? setup.semester : null;
      const className = setup.className?.trim();
      const courseName = setup.courseName?.trim();
      const studentIds = setup.studentIds ?? [];

      for (const studentId of studentIds) {
        const current = mapByStudent.get(studentId) ?? {
          studentId,
          semester: null,
          classNames: [],
          courseNames: [],
          teacherNames: []
        };

        if (semesterValue !== null && (current.semester === null || semesterValue > current.semester)) {
          current.semester = semesterValue;
        }

        this.pushUnique(current.classNames, className);
        this.pushUnique(current.courseNames, courseName);
        for (const teacherName of setup.teacherNames ?? []) {
          this.pushUnique(current.teacherNames, teacherName);
        }

        mapByStudent.set(studentId, current);
      }
    }

    // Fallback for classes without detailed setup saved yet.
    for (const classItem of classes) {
      const hasSetup = setups.some((setup) => setup.classId === classItem.id);
      if (hasSetup) {
        continue;
      }

      const semesterValue = Number.isFinite(classItem.semester) ? classItem.semester : null;
      const className = classItem.name?.trim();
      const courseName = classItem.courseName?.trim();
      const teacherName = classItem.teacherName?.trim();
      const students = classItem.students ?? [];

      for (const student of students) {
        const current = mapByStudent.get(student.studentId) ?? {
          studentId: student.studentId,
          semester: null,
          classNames: [],
          courseNames: [],
          teacherNames: []
        };

        if (semesterValue !== null && (current.semester === null || semesterValue > current.semester)) {
          current.semester = semesterValue;
        }

        this.pushUnique(current.classNames, className);
        this.pushUnique(current.courseNames, courseName);
        this.pushUnique(current.teacherNames, teacherName);

        mapByStudent.set(student.studentId, current);
      }
    }

    return mapByStudent;
  }

  private pushUnique(target: string[], value: string | undefined): void {
    if (!value) {
      return;
    }
    if (!target.includes(value)) {
      target.push(value);
    }
  }
}
