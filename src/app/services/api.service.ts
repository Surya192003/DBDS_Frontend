import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://dbds-backend.onrender.com/api';
  // private apiUrl = 'http://localhost:5010/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // ✅ Get headers method
  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // ✅ Error handler method
  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
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

  // ============ CLASS MANAGEMENT ============

  getClasses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  createClass(classData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/classes`, classData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // Students
  getActiveStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/students/active`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getClassStudents(classId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/${classId}/students`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  assignStudentToClass(classId: number, studentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/classes/${classId}/assign-student/${studentId}`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  markBulkAttendance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/bulk`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ✅ Delete class method
  deleteClass(classId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/classes/${classId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  updateSongLink(classId: number, songLink: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/classes/${classId}/song-link`,
      { song_link: songLink }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getUpcomingClasses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/upcoming`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // Get all classes for admin (with more details)
  getAllClassesForAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/admin`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // Get active instructors for dropdown
  getActiveInstructors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/classes/instructors/list`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ============ USER MANAGEMENT ============

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  toggleUserStatus(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/toggle-active`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  updatePayRate(instructorId: number, payRate: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/instructor/${instructorId}/pay-rate`,
      { pay_per_class: payRate }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/profile`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ============ ATTENDANCE MANAGEMENT ============

  markAttendance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance`, data, { headers: this.getHeaders() })
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

  // ============ PAYMENT MANAGEMENT ============

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

  // ============ REPORTS ============

  getStudentStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/student-stats`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getInstructorStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/instructor-stats`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  getInstructorMonthlyPerformance(instructorId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/instructor-monthly/${instructorId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ============ UTILITY METHODS ============

  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`)
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ✅ Get request with custom options
  getWithOptions(url: string, options?: any): Observable<any> {
    const defaultOptions = {
      headers: this.getHeaders(),
      ...options
    };
    return this.http.get(`${this.apiUrl}/${url}`, defaultOptions)
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ✅ Post request with custom options
  postWithOptions(url: string, data: any, options?: any): Observable<any> {
    const defaultOptions = {
      headers: this.getHeaders(),
      ...options
    };
    return this.http.post(`${this.apiUrl}/${url}`, data, defaultOptions)
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ✅ Put request with custom options
  putWithOptions(url: string, data: any, options?: any): Observable<any> {
    const defaultOptions = {
      headers: this.getHeaders(),
      ...options
    };
    return this.http.put(`${this.apiUrl}/${url}`, data, defaultOptions)
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  // ✅ Delete request with custom options
  deleteWithOptions(url: string, options?: any): Observable<any> {
    const defaultOptions = {
      headers: this.getHeaders(),
      ...options
    };
    return this.http.delete(`${this.apiUrl}/${url}`, defaultOptions)
      .pipe(catchError(this.handleHttpError.bind(this)));
  }
  // Groups
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

  addStudentToGroup(groupId: number, studentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/${groupId}/add-student/${studentId}`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleHttpError.bind(this)));
  }

  removeStudentFromGroup(groupId: number, studentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/groups/${groupId}/remove-student/${studentId}`, { headers: this.getHeaders() })
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
  // User profile
updateUserProfile(profileData: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/users/profile`, profileData, { headers: this.getHeaders() })
    .pipe(catchError(this.handleHttpError.bind(this)));
}

// Delete user
deleteUser(userId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleHttpError.bind(this)));
}

// Upload profile photo
uploadProfilePhoto(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('photo', file);
  
  return this.http.post(`${this.apiUrl}/upload/profile-photo`, formData, {
    headers: {
      'Authorization': `Bearer ${this.authService.token}`
      // Note: Don't set Content-Type, let browser set it with boundary
    }
  }).pipe(catchError(this.handleHttpError.bind(this)));
}

// Delete profile photo
deleteProfilePhoto(): Observable<any> {
  return this.http.delete(`${this.apiUrl}/upload/profile-photo`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleHttpError.bind(this)));
}

}