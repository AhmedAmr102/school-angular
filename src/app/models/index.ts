export interface User {
  id: string;
  userName: string;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  isActive?: boolean;
  createdDate?: string;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  userName: string;
  name: string;
  password: string;
  confirmPassword: string;
  email: string;
  role: string;
  isActive?: boolean;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  headDepartmentId: string;
  headDepartmentName?: string;
  isActive: boolean;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
  headDepartmentId: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  credits: number;
  departmentId: number;
  departmentName?: string;
  isActive: boolean;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  description: string;
  credits: number;
  departmentId: number;
}

export interface ClassStudent {
  studentId: string;
  studentName: string;
}

export interface Class {
  id: number;
  name: string;
  isActive: boolean;
  semester: number;
  startDate: string;
  endDate: string;
  courseId?: number | null;
  courseName?: string;
  teacherId?: string | null;
  teacherName?: string;
  studentCount?: number;
  departmentId?: number;
  departmentName?: string;
  students?: ClassStudent[];
}

export interface CreateClassRequest {
  name: string;
  isActive: boolean;
  semester: number;
  startDate: string;
  endDate: string;
  departmentId: number;
  courseId?: number | null;
  teacherId?: string | null;
  studentIds?: string[];
}

export interface UpdateClassAcademicSetupRequest {
  courseId: number;
  teacherId?: string | null;
  studentIds: string[];
}

export interface ClassSubjectSetupDraft {
  courseId: number;
  teacherIds: string[];
  studentIds: string[];
}

export interface ClassSubjectSetup extends ClassSubjectSetupDraft {
  classId: number;
  className: string;
  semester: number;
  departmentId?: number;
  departmentName?: string;
  courseName: string;
  teacherNames: string[];
  studentNames: string[];
}

export interface StudentAcademicOverview {
  studentId: string;
  semester: number | null;
  classNames: string[];
  courseNames: string[];
  teacherNames: string[];
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  classId: number;
  className?: string;
  courseName?: string;
  teacherId?: string;
  teacherName?: string;
  createdAt?: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  dueDate: string;
  classId: number;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  assignmentTitle?: string;
  className?: string;
  courseName?: string;
  studentId: string;
  studentName?: string;
  fileUrl?: string;
  submittedAt: string;
  grade?: number | null;
  remarks?: string;
  isVisibleToStudent?: boolean;
}

export interface GradeAssignmentRequest {
  studentId: string;
  grade?: number | null;
  remarks?: string;
  isVisibleToStudent: boolean;
}

export interface Attendance {
  id: number;
  classId: number;
  className?: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
}

export enum AttendanceStatus {
  Present = 0,
  Absent = 1,
  Late = 2
}

export interface CreateAttendanceRequest {
  classId: number;
  studentId: string;
  status: AttendanceStatus;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export enum NotificationType {
  Assignment = 'Assignment',
  Grade = 'Grade',
  Class = 'Class',
  General = 'General'
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignedCourses?: number;
  totalEnrolledCourses?: number;
  gpa?: number;
  totalAssignments?: number;
  totalCourses: number;
  totalDepartments: number;
  recentAssignments: Assignment[];
  recentNotifications: Notification[];
  attendanceRate: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
