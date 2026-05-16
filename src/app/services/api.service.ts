import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // ------ CONFIGURATION ------
  private apiUrl = 'https://dbds-backend.onrender.com/api';
  // private apiUrl = 'http://localhost:5010/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // =============================================
  //  PRIVATE HELPERS (headers & error handling)
  // =============================================

  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client‑side error
      errorMessage = error.error.message;
    } else {
      // Server‑side error → map status codes to friendly messages
      switch (error.status) {
        case 0:
          errorMessage = 'Network error: Unable to connect to server';
          break;
        case 400:
          errorMessage = error.error?.message || 'Bad request';
          break;
        case 401:
          errorMessage = error.error?.message || 'Unauthorized access';
          this.authService.forceLogout('Session expired. Please login again.');
          break;
        case 403:
          errorMessage = error.error?.message || 'Access forbidden';
          break;
        case 404:
          errorMessage = error.error?.message || 'Resource not found';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflict occurred';
          break;
        case 500:
          errorMessage = error.error?.message || 'Internal server error';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status}`;
      }
    }

    console.error('HTTP Error:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      error: error.error
    });

    return throwError(() => new Error(errorMessage));
  }

  // =============================================
  //  GENERIC HTTP METHODS (optional sugar)
  // =============================================

  getWithOptions(url: string, options?: any): Observable<any> {
    const opts = { headers: this.getHeaders(), ...options };
    return this.http.get(`${this.apiUrl}/${url}`, opts).pipe(catchError(this.handleHttpError.bind(this)));
  }

  postWithOptions(url: string, data: any, options?: any): Observable<any> {
    const opts = { headers: this.getHeaders(), ...options };
    return this.http.post(`${this.apiUrl}/${url}`, data, opts).pipe(catchError(this.handleHttpError.bind(this)));
  }

  putWithOptions(url: string, data: any, options?: any): Observable<any> {
    const opts = { headers: this.getHeaders(), ...options };
    return this.http.put(`${this.apiUrl}/${url}`, data, opts).pipe(catchError(this.handleHttpError.bind(this)));
  }

  deleteWithOptions(url: string, options?: any): Observable<any> {
    const opts = { headers: this.getHeaders(), ...options };
    return this.http.delete(`${this.apiUrl}/${url}`, opts).pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  AUTH & PROFILE
  // =============================================

  /** Get current user profile (includes role‑specific data) */
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile`, { headers: this.getHeaders() }).pipe(
      map((user: any) => {
        if (user.role === 'STUDENT' && user.student) {
          user.student_id = user.student.id;
        }
        return user;
      }),
      catchError(this.handleHttpError.bind(this))
    );
  }

  /** Update name, email, phone, address */
  updateUserProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, profileData, { headers: this.getHeaders() }).pipe(
      map((res: any) => res.profile),
      catchError(this.handleHttpError.bind(this))
    );
  }

  /** Change password while logged in */
  changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/change-password`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  /** Upload profile photo (multipart) */
  uploadProfilePhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', file);
    // Let browser set Content-Type with boundary
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.authService.token}` });
    return this.http.post(`${this.apiUrl}/upload/profile-photo`, formData, { headers })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  /** Remove profile photo */
  deleteProfilePhoto(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/upload/profile-photo`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  USERS (admin)
  // =============================================

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  toggleUserStatus(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/toggle-active`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  updatePayRate(instructorId: number, payRate: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/instructor/${instructorId}/pay-rate`,
      { pay_per_class: payRate }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  CLASSES
  // =============================================

  getClasses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getAllClassesForAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/admin`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getUpcomingClasses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/upcoming`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  createClass(classData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/classes`, classData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  deleteClass(classId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/classes/${classId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  updateSongLink(classId: number, songLink: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/classes/${classId}/song-link`,
      { song_link: songLink }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getActiveInstructors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/instructors/list`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // Students in a class
  getClassStudents(classId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/${classId}/students`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  assignStudentToClass(classId: number, studentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/classes/${classId}/assign-student/${studentId}`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  ATTENDANCE
  // =============================================

  markAttendance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  markBulkAttendance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/bulk`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getClassAttendance(classId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/class/${classId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getStudentAttendance(studentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/student/${studentId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getActiveStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/students/active`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  PAYMENTS
  // =============================================

  calculateMonthlyPayments(monthYear: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/calculate-monthly`,
      { month_year: monthYear }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getMonthlyPayments(monthYear: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/monthly/${monthYear}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  markPaymentAsPaid(paymentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/payments/${paymentId}/mark-paid`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  REPORTS
  // =============================================

  getStudentStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/student-stats`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getInstructorStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/instructor-stats`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getInstructorMonthlyPerformance(instructorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/monthly-performance/${instructorId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getInstructorTagSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/instructor-tag-summary`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  GROUPS
  // =============================================

  getGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/groups`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getGroupDetails(groupId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/groups/${groupId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  createGroup(groupData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups`, groupData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  updateGroup(groupId: number, groupData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/groups/${groupId}`, groupData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  deleteGroup(groupId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/groups/${groupId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  addStudentToGroup(groupId: number, studentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/${groupId}/add-student/${studentId}`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  removeStudentFromGroup(groupId: number, studentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/groups/${groupId}/remove-student/${studentId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  INSTRUCTOR TAGGING (work log)
  // =============================================

  tagIn(classId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/instructor/tag-in`, { class_id: classId }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  tagOut(classId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/instructor/tag-out`, { class_id: classId }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getTagStatus(classId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/instructor/tag-status/${classId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // =============================================
  //  SETTINGS
  // =============================================

  getSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`);
  }
  getAcademicYear(): Observable<{ start: string; end: string }> {
    return this.http.get<{ start: string; end: string }>(`${this.apiUrl}/settings/academic-year`);
  }

  updateSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings`, data);
  }

  // =============================================
  //  UTILITY
  // =============================================

  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`)
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // REPORTS
  sendMonthlyReport(month: string, instructorId?: number): Observable<any> {
    let url = `${this.apiUrl}/eachreports/instructor-monthly?month=${month}`;
    if (instructorId) url += `&instructor_id=${instructorId}`;
    return this.http.get(url, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }
}