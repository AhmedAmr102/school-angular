import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationType } from '../models';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Department,
  CreateDepartmentRequest,
  Course,
  CreateCourseRequest,
  Class,
  CreateClassRequest,
  ClassSubjectSetup,
  ClassSubjectSetupDraft,
  UpdateClassAcademicSetupRequest,
  Assignment,
  CreateAssignmentRequest,
  GradeAssignmentRequest,
  AssignmentSubmission,
  Attendance,
  CreateAttendanceRequest,
  Notification,
  User
} from '../models';

interface BackendResponse<T> {
  data: T;
  message: string;
  isSuccess: boolean;
  errorCode: number;
}

interface BackendPagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface BackendLoginDto {
  userName: string;
  name: string;
  role: string;
  token: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

interface BackendRefreshDto {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

interface BackendManagedUserDto {
  id: string;
  userName: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdDate: string;
}

interface BackendTeacherDashboardStatsDto {
  totalAssignedCourses: number;
  totalStudents: number;
  totalAssignments: number;
}

interface BackendStudentDashboardStatsDto {
  totalEnrolledCourses: number;
  totalEnrolledClasses: number;
  gpa: number;
}

interface BackendManagedClassStudentDto {
  studentId: string;
  studentName: string;
}

interface BackendManagedClassDto {
  id: number;
  name: string;
  isActive: boolean;
  semester: number;
  startDate: string;
  endDate: string;
  courseId: number | null;
  courseName: string | null;
  departmentId: number;
  departmentName: string;
  teacherId: string | null;
  teacherName: string | null;
  students: BackendManagedClassStudentDto[] | null;
}

interface BackendManageableCourseDto {
  id: number;
  name: string;
  code: string;
  departmentId: number;
  departmentName: string;
}

interface BackendManagedAssignmentDto {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  classId: number;
  className: string;
  courseName: string;
  createdByTeacherId: string;
  teacherName: string;
  createdDate: string;
}

interface BackendAssignmentStudentGradeDto {
  studentId: string;
  studentName: string;
  grade: number | null;
  remarks: string | null;
  isVisibleToStudent: boolean;
  submittedDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_BASE_URL = '/api';
  private readonly LOCAL_CLASS_SUBJECT_SETUP_KEY = 'school.classSubjectSetups.v1';
  private token: string | null = null;
  private refreshToken: string | null = null;

  private departmentNameById = new Map<number, string>();
  private courseNameById = new Map<number, string>();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loadTokens();
  }

  private loadTokens(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      this.refreshToken = localStorage.getItem('refreshToken');
      if (this.token && this.isTokenExpired(this.token)) {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      const userStr = localStorage.getItem('user');
      if (this.token && userStr) {
        try {
          this.currentUserSubject.next(JSON.parse(userStr));
        } catch {
          localStorage.removeItem('user');
        }
      } else {
        this.currentUserSubject.next(null);
      }
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    return headers;
  }

  private unwrapResponse<T>(response: BackendResponse<T> | null | undefined): T {
    if (!response) {
      throw new Error('Empty response from server.');
    }
    if (!response.isSuccess) {
      throw new Error(response.message || 'Request failed.');
    }
    return response.data;
  }

  private decodeToken(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(normalized)
          .split('')
          .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private claim(payload: Record<string, unknown> | null, ...keys: string[]): string {
    if (!payload) {
      return '';
    }
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === 'string') {
        return value;
      }
    }
    return '';
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) {
      return true;
    }

    const exp = payload['exp'];
    if (typeof exp !== 'number') {
      return true;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp <= nowSeconds;
  }

  private mapLoginToUser(data: BackendLoginDto): User {
    const tokenPayload = this.decodeToken(data.token);
    const id = this.claim(tokenPayload, 'nameid', 'sub', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier');
    const email = this.claim(tokenPayload, 'email', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress');
    return {
      id,
      userName: data.userName,
      name: data.name,
      email,
      role: (data.role as User['role']) || 'Student',
      isActive: true
    };
  }

  private mapManagedUser(dto: BackendManagedUserDto): User {
    return {
      id: dto.id,
      userName: dto.userName,
      name: dto.name,
      email: dto.email,
      role: (dto.role as User['role']) || 'Student',
      isActive: dto.isActive,
      createdDate: dto.createdDate
    };
  }

  private mapManagedClass(dto: BackendManagedClassDto): Class {
    const students = Array.isArray(dto.students)
      ? dto.students.map((student) => ({
          studentId: student.studentId,
          studentName: student.studentName
        }))
      : [];

    return {
      id: dto.id,
      name: dto.name,
      isActive: dto.isActive,
      semester: Number(dto.semester) || 0,
      startDate: String(dto.startDate ?? ''),
      endDate: String(dto.endDate ?? ''),
      courseId: dto.courseId ?? null,
      courseName: dto.courseName ?? (dto.courseId ? `Course #${dto.courseId}` : ''),
      teacherId: dto.teacherId ?? null,
      teacherName: dto.teacherName ?? '',
      studentCount: students.length,
      departmentId: dto.departmentId,
      departmentName: dto.departmentName ?? '',
      students
    };
  }

  private mapManagedAssignment(dto: BackendManagedAssignmentDto): Assignment {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description ?? '',
      dueDate: String(dto.dueDate ?? ''),
      classId: dto.classId,
      className: dto.className ?? `Class #${dto.classId}`,
      courseName: dto.courseName ?? '',
      teacherId: dto.createdByTeacherId,
      teacherName: dto.teacherName ?? '',
      createdAt: dto.createdDate
    };
  }

  private mapAssignmentStudentGrade(dto: BackendAssignmentStudentGradeDto): AssignmentSubmission {
    return {
      id: 0,
      assignmentId: 0,
      studentId: dto.studentId,
      studentName: dto.studentName,
      submittedAt: String(dto.submittedDate ?? ''),
      grade: dto.grade ?? null,
      remarks: dto.remarks ?? '',
      isVisibleToStudent: dto.isVisibleToStudent
    };
  }

  private mapDepartment(dto: any): Department {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? '',
      headDepartmentId: dto.headOfDepartmentId ?? dto.headDepartmentId ?? '',
      headDepartmentName: dto.headOfDepartmentName ?? dto.headDepartmentName ?? dto.headName ?? '',
      isActive: true
    };
  }

  private mapCourse(dto: any): Course {
    return {
      id: dto.id,
      name: dto.name,
      code: dto.code,
      description: dto.description ?? '',
      credits: dto.credits,
      departmentId: dto.departmentId,
      departmentName: this.departmentNameById.get(dto.departmentId) ?? '',
      isActive: true
    };
  }

  private mapTeacherClass(dto: any): Class {
    return {
      id: dto.id,
      name: dto.name,
      isActive: true,
      semester: Number(dto.semester) || 0,
      startDate: String(dto.startDate ?? ''),
      endDate: String(dto.endDate ?? ''),
      courseId: dto.courseId ?? null,
      courseName: dto.courseId ? (this.courseNameById.get(dto.courseId) ?? `Course #${dto.courseId}`) : '',
      teacherId: this.getCurrentUser()?.id,
      teacherName: this.getCurrentUser()?.name ?? '',
      studentCount: Array.isArray(dto.studentsInClass) ? dto.studentsInClass.length : 0
    };
  }

  private mapStudentClass(dto: any): Class {
    return {
      id: dto.classId,
      name: dto.className ?? '',
      isActive: true,
      semester: Number(dto.semester) || 0,
      startDate: String(dto.startDate ?? ''),
      endDate: String(dto.endDate ?? ''),
      courseId: null,
      courseName: dto.courseName ?? '',
      teacherName: dto.teacherName ?? '',
      departmentId: dto.departmentId ?? undefined,
      departmentName: dto.departmentName ?? '',
      studentCount: undefined
    };
  }

  private formatDateForApi(value: string): string {
    if (!value) {
      return value;
    }
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  private readLocalClassSubjectSetupStore(): Record<string, ClassSubjectSetupDraft[]> {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(this.LOCAL_CLASS_SUBJECT_SETUP_KEY);
      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw) as Record<string, ClassSubjectSetupDraft[]>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeLocalClassSubjectSetupStore(store: Record<string, ClassSubjectSetupDraft[]>): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(this.LOCAL_CLASS_SUBJECT_SETUP_KEY, JSON.stringify(store));
  }

  private normalizeSetupDrafts(items: ClassSubjectSetupDraft[]): ClassSubjectSetupDraft[] {
    return items
      .filter((item) => Number.isFinite(item.courseId) && item.courseId > 0)
      .map((item) => ({
        courseId: Number(item.courseId),
        teacherIds: Array.from(new Set((item.teacherIds ?? []).filter((id) => !!id))),
        studentIds: Array.from(new Set((item.studentIds ?? []).filter((id) => !!id)))
      }));
  }

  getClassSubjectSetupDraft(classId: number, fallbackClass?: Class): ClassSubjectSetupDraft[] {
    const store = this.readLocalClassSubjectSetupStore();
    const key = String(classId);
    const fromStore = Array.isArray(store[key]) ? this.normalizeSetupDrafts(store[key]) : [];
    if (fromStore.length > 0) {
      return fromStore;
    }

    const fallbackCourseId = fallbackClass?.courseId ?? null;
    if (!fallbackCourseId) {
      return [];
    }

    return [{
      courseId: fallbackCourseId,
      teacherIds: fallbackClass?.teacherId ? [fallbackClass.teacherId] : [],
      studentIds: (fallbackClass?.students ?? []).map((student) => student.studentId)
    }];
  }

  private buildClassSubjectSetups(
    classes: Class[],
    courses: Course[],
    teachers: User[],
    students: User[],
    classIdFilter?: number
  ): ClassSubjectSetup[] {
    const courseNameById = new Map(courses.map((course) => [course.id, `${course.code} - ${course.name}`]));
    const teacherNameById = new Map(teachers.map((teacher) => [teacher.id, teacher.name]));
    const studentNameById = new Map(students.map((student) => [student.id, student.name]));
    const targetClasses = classIdFilter
      ? classes.filter((classItem) => classItem.id === classIdFilter)
      : classes;

    return targetClasses.flatMap((classItem) => {
      const classStudentNameById = new Map((classItem.students ?? []).map((student) => [student.studentId, student.studentName]));
      const drafts = this.getClassSubjectSetupDraft(classItem.id, classItem);

      return drafts.map((draft) => {
        const effectiveStudentIds = draft.studentIds.length > 0
          ? draft.studentIds
          : (classItem.students ?? []).map((student) => student.studentId);

        return {
          ...draft,
          classId: classItem.id,
          className: classItem.name,
          semester: classItem.semester,
          departmentId: classItem.departmentId,
          departmentName: classItem.departmentName,
          courseName: courseNameById.get(draft.courseId) ?? classItem.courseName ?? `Course #${draft.courseId}`,
          teacherNames: draft.teacherIds.map((id) => teacherNameById.get(id) ?? id),
          studentNames: effectiveStudentIds.map((id) => studentNameById.get(id) ?? classStudentNameById.get(id) ?? id),
          studentIds: effectiveStudentIds
        } as ClassSubjectSetup;
      });
    });
  }

  getClassSubjectSetupsForClass(classId: number): Observable<ClassSubjectSetup[]> {
    return forkJoin({
      classes: this.getClasses(),
      courses: this.getManageableCourses().pipe(catchError(() => this.getCourses().pipe(catchError(() => of([] as Course[]))))),
      teachers: this.getUsers('Teacher').pipe(catchError(() => of([] as User[]))),
      students: this.getUsers('Student').pipe(catchError(() => of([] as User[])))
    }).pipe(
      map(({ classes, courses, teachers, students }) =>
        this.buildClassSubjectSetups(classes, courses, teachers, students, classId)
      )
    );
  }

  getClassSubjectSetups(): Observable<ClassSubjectSetup[]> {
    return forkJoin({
      classes: this.getClasses(),
      courses: this.getManageableCourses().pipe(catchError(() => this.getCourses().pipe(catchError(() => of([] as Course[]))))),
      teachers: this.getUsers('Teacher').pipe(catchError(() => of([] as User[]))),
      students: this.getUsers('Student').pipe(catchError(() => of([] as User[])))
    }).pipe(
      map(({ classes, courses, teachers, students }) =>
        this.buildClassSubjectSetups(classes, courses, teachers, students)
      )
    );
  }

  saveClassSubjectSetups(classId: number, drafts: ClassSubjectSetupDraft[]): Observable<void> {
    const normalizedDrafts = this.normalizeSetupDrafts(drafts);
    const primary = normalizedDrafts[0];
    const backendSync$ = primary
      ? this.updateClassAcademicSetup(classId, {
          courseId: primary.courseId,
          teacherId: primary.teacherIds[0] ?? null,
          studentIds: primary.studentIds
        })
      : of(undefined);

    return backendSync$.pipe(
      tap(() => {
        const store = this.readLocalClassSubjectSetupStore();
        if (normalizedDrafts.length > 0) {
          store[String(classId)] = normalizedDrafts;
        } else {
          delete store[String(classId)];
        }
        this.writeLocalClassSubjectSetupStore(store);
      })
    );
  }

  updateStudentEnrollmentInClass(classId: number, studentId: string, courseIds: number[]): Observable<void> {
    const selectedCourseIdSet = new Set(courseIds.filter((courseId) => Number.isFinite(courseId) && courseId > 0));

    return this.getClassSubjectSetupsForClass(classId).pipe(
      switchMap((setups) => {
        if (setups.length === 0) {
          throw new Error('No class subjects found. Configure class subjects first.');
        }

        const drafts: ClassSubjectSetupDraft[] = setups.map((setup) => {
          const nextStudentIds = new Set(setup.studentIds ?? []);
          if (selectedCourseIdSet.has(setup.courseId)) {
            nextStudentIds.add(studentId);
          } else {
            nextStudentIds.delete(studentId);
          }

          return {
            courseId: setup.courseId,
            teacherIds: setup.teacherIds,
            studentIds: Array.from(nextStudentIds)
          };
        });

        const classStudentIds = Array.from(new Set(drafts.flatMap((item) => item.studentIds)));

        return this.saveClassSubjectSetups(classId, drafts).pipe(
          switchMap(() => this.updateClassStudents(classId, classStudentIds).pipe(catchError(() => of(undefined))))
        );
      }),
      map(() => undefined)
    );
  }

  private resolveClassPayloadForBackend(data: CreateClassRequest): Observable<CreateClassRequest> {
    const needsCourse = !data.courseId;
    const needsTeacher = !data.teacherId;
    const currentUser = this.getCurrentUser();
    const currentTeacherId = currentUser?.role === 'Teacher' ? currentUser.id : null;

    if (!needsCourse && !needsTeacher) {
      return of(data);
    }

    return forkJoin({
      courses: needsCourse
        ? this.getManageableCourses().pipe(catchError(() => of([] as Course[])))
        : of([] as Course[]),
      teachers: needsTeacher && !currentTeacherId
        ? this.getUsers('Teacher').pipe(catchError(() => of([] as User[])))
        : of([] as User[])
    }).pipe(
      map(({ courses, teachers }) => {
        const departmentCourses = courses.filter((course) => course.departmentId === data.departmentId);
        const fallbackCourseId = departmentCourses[0]?.id ?? null;
        const activeTeachers = teachers.filter((teacher) => teacher.isActive);
        const fallbackTeacherId = currentTeacherId ?? activeTeachers[0]?.id ?? null;

        const resolvedCourseId = data.courseId ?? fallbackCourseId;
        const resolvedTeacherId = data.teacherId ?? fallbackTeacherId;

        if (!resolvedCourseId) {
          throw new Error('No subject found for the selected department. Please create a subject first.');
        }

        if (!resolvedTeacherId) {
          throw new Error('No active teacher found. Please activate or create a teacher account first.');
        }

        return {
          ...data,
          courseId: resolvedCourseId,
          teacherId: resolvedTeacherId
        };
      })
    );
  }

  private mapTeacherAssignment(dto: any): Assignment {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description ?? '',
      dueDate: String(dto.dueDate ?? ''),
      classId: dto.classId,
      className: dto.className ?? `Class #${dto.classId}`,
      courseName: dto.courseName ?? '',
      teacherId: dto.createdByTeacherId,
      teacherName: dto.teacherName ?? '',
      createdAt: dto.createdDate
    };
  }

  private mapStudentAssignment(dto: any): Assignment {
    return {
      id: dto.assignmentId,
      title: dto.title,
      description: dto.description ?? '',
      dueDate: String(dto.dueDate ?? ''),
      classId: 0,
      className: dto.className ?? '',
      createdAt: undefined
    };
  }

  private mapGrade(dto: any): AssignmentSubmission {
    return {
      id: dto.assignmentId,
      assignmentId: dto.assignmentId,
      assignmentTitle: dto.assignmentTitle ?? '',
      className: dto.className ?? '',
      courseName: dto.courseName ?? '',
      studentId: this.getCurrentUser()?.id ?? '',
      studentName: this.getCurrentUser()?.name ?? '',
      submittedAt: String(dto.submittedDate ?? ''),
      grade: dto.grade ?? null,
      remarks: dto.remarks ?? ''
    };
  }

  private mapTeacherAttendance(dto: any, classId: number): Attendance {
    return {
      id: 0,
      classId,
      className: `Class #${classId}`,
      studentId: dto.studentId ?? '',
      studentName: dto.studentName ?? '',
      date: String(dto.date ?? ''),
      status: dto.status
    };
  }

  private mapStudentAttendance(dto: any): Attendance {
    return {
      id: 0,
      classId: dto.classId,
      className: dto.className ?? '',
      studentId: this.getCurrentUser()?.id ?? '',
      studentName: this.getCurrentUser()?.name ?? 'You',
      date: String(dto.date ?? ''),
      status: dto.status
    };
  }

  private mapNotification(dto: any): Notification {
    return {
      id: dto.id,
      title: dto.title ?? '',
      message: dto.message ?? '',
      type: NotificationType.General,
      isRead: !!dto.isRead,
      createdAt: String(dto.createdAt ?? new Date().toISOString()),
      userId: this.getCurrentUser()?.id ?? ''
    };
  }

  private createNotificationsStream(): Observable<Notification[]> {
    return new Observable<Notification[]>((observer) => {
      if (!this.token || typeof window === 'undefined') {
        observer.next([]);
        observer.complete();
        return () => undefined;
      }

      const controller = new AbortController();
      const notifications: Notification[] = [];

      fetch(`${this.API_BASE_URL}/student/Notifications/stream`, {
        headers: { Authorization: `Bearer ${this.token}` },
        signal: controller.signal
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            throw new Error('Failed to connect to notifications stream.');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            let normalizedBuffer = buffer.replace(/\r/g, '');
            let boundary = normalizedBuffer.indexOf('\n\n');

            while (boundary >= 0) {
              const chunk = normalizedBuffer.slice(0, boundary);
              normalizedBuffer = normalizedBuffer.slice(boundary + 2);
              buffer = normalizedBuffer;

              const dataLine = chunk
                .split('\n')
                .find((line) => line.startsWith('data:'));

              if (dataLine) {
                const raw = dataLine.slice(5).trim();
                if (raw) {
                  try {
                    const dto = JSON.parse(raw);
                    notifications.unshift(this.mapNotification(dto));
                    observer.next([...notifications]);
                  } catch {
                    // Ignore malformed events.
                  }
                }
              }

              boundary = normalizedBuffer.indexOf('\n\n');
            }
          }
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            observer.error(error);
          }
        });

      return () => controller.abort();
    });
  }

  private handleError(error: unknown): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error instanceof Error && !(error instanceof HttpErrorResponse)) {
      errorMessage = error.message;
    } else if (error instanceof HttpErrorResponse && error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const httpError = error as HttpErrorResponse;
      switch (httpError?.status) {
        case 0:
          errorMessage = 'Cannot reach backend API. Ensure backend is running and proxy is configured.';
          break;
        case 401:
          errorMessage = 'Session expired. Please login again.';
          this.logout();
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = httpError?.error?.message || httpError?.message || errorMessage;
      }
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });

    return throwError(() => new Error(errorMessage));
  }

  setTokens(token: string, refreshToken: string, user: User): void {
    this.token = token;
    this.refreshToken = refreshToken;
    this.currentUserSubject.next(user);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  logout(): void {
    this.token = null;
    this.refreshToken = null;
    this.currentUserSubject.next(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.token && !this.isTokenExpired(this.token);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  private performLogin(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<BackendResponse<BackendLoginDto>>(
      `${this.API_BASE_URL}/auth/Account/login`,
      data
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((dataDto) => ({
        token: dataDto.token,
        refreshToken: dataDto.refreshToken,
        user: this.mapLoginToUser(dataDto)
      })),
      tap(response => {
        this.setTokens(response.token, response.refreshToken, response.user);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Auth endpoints
  login(data: LoginRequest): Observable<LoginResponse> {
    return this.performLogin(data);
  }

  register(data: RegisterRequest): Observable<void> {
    return this.http.post<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/auth/Account/Register`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  forgotPassword(email: string): Observable<void> {
    return throwError(() => new Error('Forgot password endpoint is not available in this backend.'));
  }

  refreshAccessToken(): Observable<LoginResponse> {
    return this.http.post<BackendResponse<BackendRefreshDto>>(
      `${this.API_BASE_URL}/auth/Account/RefreshToken`,
      { refreshToken: this.refreshToken }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((dataDto) => {
        const tokenPayload = this.decodeToken(dataDto.accessToken);
        const currentUser = this.getCurrentUser();
        const roleClaim = this.claim(tokenPayload, 'role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role');
        const userNameClaim = this.claim(tokenPayload, 'unique_name', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name');
        const userIdClaim = this.claim(tokenPayload, 'nameid', 'sub', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier');

        const user: User = {
          id: currentUser?.id || userIdClaim,
          userName: currentUser?.userName || userNameClaim,
          name: currentUser?.name || userNameClaim,
          email: currentUser?.email || '',
          role: ((currentUser?.role || roleClaim || 'Student') as User['role'])
        };

        return {
          token: dataDto.accessToken,
          refreshToken: dataDto.refreshToken,
          user
        };
      }),
      tap(response => {
        this.setTokens(response.token, response.refreshToken, response.user);
      }),
      catchError(error => {
        this.logout();
        return this.handleError(error);
      })
    );
  }

  // Admin - Departments
  getDepartments(): Observable<Department[]> {
    return this.http.get<BackendResponse<any[]>>(
      `${this.API_BASE_URL}/admin/Departments`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapDepartment(item))),
      switchMap((items) => {
        const needsHeadName = items.some((dept) => !!dept.headDepartmentId && !dept.headDepartmentName);
        if (!needsHeadName) {
          return of(items);
        }

        return this.getUsers().pipe(
          map((users) => {
            const userNameById = new Map(users.map((user) => [user.id, user.name]));
            return items.map((dept) => ({
              ...dept,
              headDepartmentName: dept.headDepartmentName || userNameById.get(dept.headDepartmentId) || ''
            }));
          }),
          catchError(() => of(items))
        );
      }),
      tap((items) => {
        this.departmentNameById.clear();
        items.forEach((dept) => this.departmentNameById.set(dept.id, dept.name));
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDepartment(id: number): Observable<Department> {
    return this.http.get<BackendResponse<any>>(
      `${this.API_BASE_URL}/admin/Departments/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.mapDepartment(this.unwrapResponse(response))),
      catchError(error => this.handleError(error))
    );
  }

  createDepartment(data: CreateDepartmentRequest): Observable<void> {
    return this.http.post<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Departments`,
      {
        name: data.name,
        description: data.description,
        headOfDepartmentId: data.headDepartmentId || null
      },
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  updateDepartment(id: number, data: CreateDepartmentRequest): Observable<void> {
    return this.http.put<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Departments/${id}`,
      {
        id,
        name: data.name,
        description: data.description,
        headOfDepartmentId: data.headDepartmentId || null
      },
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Departments/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Admin - Courses
  getCourses(): Observable<Course[]> {
    return this.http.get<BackendResponse<any[]>>(
      `${this.API_BASE_URL}/admin/Courses`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapCourse(item))),
      tap((items) => {
        this.courseNameById.clear();
        items.forEach((course) => this.courseNameById.set(course.id, course.name));
      }),
      catchError(error => this.handleError(error))
    );
  }

  getCourse(id: number): Observable<Course> {
    return this.http.get<BackendResponse<any>>(
      `${this.API_BASE_URL}/admin/Courses/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.mapCourse(this.unwrapResponse(response))),
      catchError(error => this.handleError(error))
    );
  }

  createCourse(data: CreateCourseRequest): Observable<void> {
    return this.http.post<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Courses`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  updateCourse(id: number, data: CreateCourseRequest): Observable<void> {
    return this.http.put<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Courses/${id}`,
      { ...data, id },
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Courses/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getManageableCourses(): Observable<Course[]> {
    return this.http.get<BackendResponse<BackendManageableCourseDto[]>>(
      `${this.API_BASE_URL}/management/Classes/courses`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        description: '',
        credits: 0,
        departmentId: item.departmentId,
        departmentName: item.departmentName,
        isActive: true
      } as Course))),
      catchError(error => this.handleError(error))
    );
  }

  // Teacher - Classes
  getClasses(): Observable<Class[]> {
    if (this.hasRole('Student')) {
      return this.http.get<BackendResponse<BackendPagedResult<any>>>(
        `${this.API_BASE_URL}/student/Classes`,
        { headers: this.getHeaders() }
      ).pipe(
        map((response) => this.unwrapResponse(response)),
        map((paged) => paged.items.map((item) => this.mapStudentClass(item))),
        catchError(error => this.handleError(error))
      );
    }

    if (!(this.hasRole('Teacher') || this.hasRole('Admin'))) {
      return of([]);
    }

    return this.http.get<BackendResponse<BackendManagedClassDto[]>>(
      `${this.API_BASE_URL}/management/Classes`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapManagedClass(item))),
      catchError(error => this.handleError(error))
    );
  }

  getClass(id: number): Observable<Class> {
    return this.getClasses().pipe(
      map((items) => {
        const found = items.find((item) => item.id === id);
        if (!found) {
          throw new Error('Class not found.');
        }
        return found;
      }),
      catchError(error => this.handleError(error))
    );
  }

  createClass(data: CreateClassRequest): Observable<void> {
    return this.resolveClassPayloadForBackend(data).pipe(
      switchMap((payload) =>
        this.http.post<BackendResponse<boolean>>(
          `${this.API_BASE_URL}/management/Classes`,
          {
            ...payload,
            courseId: payload.courseId ?? null,
            teacherId: payload.teacherId ?? null,
            studentIds: payload.studentIds ?? []
          },
          { headers: this.getHeaders() }
        )
      ),
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  updateClass(id: number, data: CreateClassRequest): Observable<void> {
    return this.resolveClassPayloadForBackend(data).pipe(
      switchMap((payload) =>
        this.http.put<BackendResponse<boolean>>(
          `${this.API_BASE_URL}/management/Classes/${id}`,
          {
            ...payload,
            id,
            courseId: payload.courseId ?? null,
            teacherId: payload.teacherId ?? null,
            studentIds: payload.studentIds ?? []
          },
          { headers: this.getHeaders() }
        )
      ),
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/management/Classes/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  updateClassStudents(classId: number, studentIds: string[]): Observable<void> {
    return this.http.put<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/management/Classes/${classId}/students`,
      { studentIds },
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getClassStudents(classId: number): Observable<{ studentId: string; studentName: string }[]> {
    return this.http.get<BackendResponse<Array<{ studentId: string; studentName: string }>>>(
      `${this.API_BASE_URL}/management/Classes/${classId}/students`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  updateClassAcademicSetup(classId: number, data: UpdateClassAcademicSetupRequest): Observable<void> {
    return this.getClass(classId).pipe(
      switchMap((existingClass) => {
        const payload: CreateClassRequest = {
          name: existingClass.name,
          isActive: existingClass.isActive,
          semester: Number(existingClass.semester) || 1,
          startDate: this.formatDateForApi(existingClass.startDate),
          endDate: this.formatDateForApi(existingClass.endDate),
          departmentId: existingClass.departmentId ?? 0,
          courseId: data.courseId,
          teacherId: data.teacherId ?? null,
          studentIds: data.studentIds
        };

        return this.updateClass(classId, payload);
      })
    );
  }

  // Teacher - Assignments
  getAssignments(): Observable<Assignment[]> {
    if (this.hasRole('Student')) {
      return this.getStudentAssignments();
    }

    if (!(this.hasRole('Teacher') || this.hasRole('Admin'))) {
      return of([]);
    }

    return this.http.get<BackendResponse<BackendManagedAssignmentDto[]>>(
      `${this.API_BASE_URL}/management/Assignments`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapManagedAssignment(item))),
      catchError(error => this.handleError(error))
    );
  }

  getAssignment(id: number): Observable<Assignment> {
    return this.getAssignments().pipe(
      map((items) => {
        const found = items.find((item) => item.id === id);
        if (!found) {
          throw new Error('Assignment not found.');
        }
        return found;
      }),
      catchError(error => this.handleError(error))
    );
  }

  createAssignment(data: CreateAssignmentRequest): Observable<void> {
    return this.http.post<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/management/Assignments`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getAssignmentStudentsForGrading(assignmentId: number): Observable<AssignmentSubmission[]> {
    return this.http.get<BackendResponse<BackendAssignmentStudentGradeDto[]>>(
      `${this.API_BASE_URL}/management/Assignments/${assignmentId}/students`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) =>
        items.map((item) => {
          const mapped = this.mapAssignmentStudentGrade(item);
          mapped.assignmentId = assignmentId;
          return mapped;
        })
      ),
      catchError(error => this.handleError(error))
    );
  }

  gradeAssignment(assignmentId: number, data: GradeAssignmentRequest): Observable<void> {
    return this.http.post<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/management/Assignments/${assignmentId}/grade`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Student - Assignments
  getStudentAssignments(): Observable<Assignment[]> {
    return this.http.get<BackendResponse<any[]>>(
      `${this.API_BASE_URL}/student/Assignments`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapStudentAssignment(item))),
      catchError(error => this.handleError(error))
    );
  }

  submitAssignment(assignmentId: number, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    
    let headers = new HttpHeaders();
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }
    
    return this.http.post<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/student/Assignments/${assignmentId}/submit`,
      formData,
      { headers }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getStudentGrades(): Observable<AssignmentSubmission[]> {
    return this.http.get<BackendResponse<any[]>>(
      `${this.API_BASE_URL}/student/Assignments/grads`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapGrade(item))),
      catchError(error => this.handleError(error))
    );
  }

  // Attendance
  createAttendance(data: CreateAttendanceRequest): Observable<void> {
    return this.http.post<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/teacher/Attendance`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getClassAttendance(classId: number): Observable<Attendance[]> {
    return this.http.get<BackendResponse<any[]>>(
      `${this.API_BASE_URL}/teacher/Attendance/${classId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapTeacherAttendance(item, classId))),
      catchError(error => this.handleError(error))
    );
  }

  getStudentAttendance(): Observable<Attendance[]> {
    return this.http.get<BackendResponse<any[]>>(
      `${this.API_BASE_URL}/student/Attendance`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapStudentAttendance(item))),
      catchError(error => this.handleError(error))
    );
  }

  // Notifications
  getNotifications(): Observable<Notification[]> {
    if (!this.hasRole('Student')) {
      return of([]);
    }
    return this.createNotificationsStream().pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Admin - Users
  getUsers(role?: 'Admin' | 'Teacher' | 'Student'): Observable<User[]> {
    const roleQuery = role ? `?role=${encodeURIComponent(role)}` : '';
    return this.http.get<BackendResponse<BackendManagedUserDto[]>>(
      `${this.API_BASE_URL}/admin/Users${roleQuery}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      map((items) => items.map((item) => this.mapManagedUser(item))),
      catchError(error => this.handleError(error))
    );
  }

  activateUser(userId: string): Observable<void> {
    return this.http.put<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Users/${userId}/activate`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.put<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Users/${userId}/deactivate`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<BackendResponse<boolean>>(
      `${this.API_BASE_URL}/admin/Users/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => {
        this.unwrapResponse(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  getAdminTotalStudents(): Observable<number> {
    return this.http.get<BackendResponse<number>>(
      `${this.API_BASE_URL}/admin/total-students`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getAdminTotalTeachers(): Observable<number> {
    return this.http.get<BackendResponse<number>>(
      `${this.API_BASE_URL}/admin/total-teachers`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getAdminTotalDepartments(): Observable<number> {
    return this.http.get<BackendResponse<number>>(
      `${this.API_BASE_URL}/admin/total-departments`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getAdminTotalCourses(): Observable<number> {
    return this.http.get<BackendResponse<number>>(
      `${this.API_BASE_URL}/admin/total-courses`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getAdminTotalClasses(): Observable<number> {
    return this.http.get<BackendResponse<number>>(
      `${this.API_BASE_URL}/admin/total-classes`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getTeacherDashboardStats(): Observable<BackendTeacherDashboardStatsDto> {
    return this.http.get<BackendResponse<BackendTeacherDashboardStatsDto>>(
      `${this.API_BASE_URL}/teacher/dashboard-stats`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }

  getStudentDashboardStats(): Observable<BackendStudentDashboardStatsDto> {
    return this.http.get<BackendResponse<BackendStudentDashboardStatsDto>>(
      `${this.API_BASE_URL}/student/dashboard-stats`,
      { headers: this.getHeaders() }
    ).pipe(
      map((response) => this.unwrapResponse(response)),
      catchError(error => this.handleError(error))
    );
  }
}
