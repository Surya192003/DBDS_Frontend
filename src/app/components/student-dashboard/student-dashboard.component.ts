import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  template: `
    <div class="container-fluid">
  <!-- Loading State -->
  <div *ngIf="loading" class="text-center py-4">
    <div class="spinner-border text-primary"></div>
    <p class="mt-2">Loading your data...</p>
  </div>

  <!-- Content -->
  <div *ngIf="!loading">
    <h3>Student Dashboard</h3>
    <hr>

    <!-- Attendance Summary -->
    <div class="row mb-4">
      <div class="col-md-4 mb-3">
        <div class="card bg-primary text-white">
          <div class="card-body text-center">
            <h6 class="card-title">Total Classes</h6>
            <h2 class="mb-0">{{attendanceSummary.totalClasses}}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-3">
        <div class="card bg-success text-white">
          <div class="card-body text-center">
            <h6 class="card-title">Classes Attended</h6>
            <h2 class="mb-0">{{attendanceSummary.present}}</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-3">
        <div class="card bg-danger text-white">
          <div class="card-body text-center">
            <h6 class="card-title">Classes Missed</h6>
            <h2 class="mb-0">{{attendanceSummary.absent}}</h2>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Classes -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Upcoming Classes</h5>
      </div>
      <div class="card-body">
        <div *ngIf="upcomingClasses.length === 0" class="text-center py-4">
          <p class="text-muted">No upcoming classes scheduled</p>
        </div>
        <div *ngIf="upcomingClasses.length > 0" class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Instructor</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let classItem of upcomingClasses">
                <td>{{classItem.class_name || 'Class'}}</td>
                <td>{{classItem.class_date | date:'mediumDate'}}</td>
                <td>{{formatTime(classItem.class_time)}}</td>
                <td>{{classItem.instructor_name}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Attendance History -->
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Attendance History</h5>
        <small class="text-muted">{{attendanceHistory.length}} classes</small>
      </div>
      <div class="card-body">
        <div *ngIf="attendanceHistory.length === 0" class="text-center py-4">
          <p class="text-muted">No attendance history available</p>
        </div>
        <div *ngIf="attendanceHistory.length > 0" class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Instructor</th>
                <th>Status</th>
                <th>Song Link</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let record of attendanceHistory" 
                  [class.table-success]="record.is_present" 
                  [class.table-danger]="!record.is_present">
                <td>{{getClassName(record.class_id)}}</td>
                <td>{{record.class_date | date:'mediumDate'}}</td>
                <td>{{formatTime(record.class_time)}}</td>
                <td>{{record.instructor_name}}</td>
                <td>
                  <span [class]="record.is_present ? 'badge bg-success' : 'badge bg-danger'">
                    {{record.is_present ? 'Present' : 'Absent'}}
                  </span>
                </td>
                <td>
                  <a *ngIf="record.song_link && record.is_present" 
                     [href]="record.song_link" 
                     target="_blank" 
                     class="btn btn-sm btn-outline-info">
                    Listen
                  </a>
                  <span *ngIf="!record.song_link || !record.is_present" class="text-muted">-</span>
                </td>
                <td>
                  <span *ngIf="record.check_in_time">{{record.check_in_time | date:'short'}}</span>
                  <span *ngIf="!record.check_in_time" class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class StudentDashboardComponent implements OnInit {
  upcomingClasses: any[] = [];
  loading: boolean = false;
  allClasses: any[] = []; 
  attendanceHistory: any[] = [];
  attendanceSummary: any = {
    totalClasses: 0,
    present: 0,
    absent: 0
  };
  currentUser: any;

  constructor(private apiService: ApiService, private authService: AuthService) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.loadUpcomingClasses();
    if (this.currentUser?.roleId) {
      this.loadAttendanceHistory();
    }
  }

  

  loadUpcomingClasses() {
    this.apiService.getUpcomingClasses().subscribe(
      (data: any) => {
        this.upcomingClasses = data;
      },
      error => console.error('Error loading upcoming classes:', error)
    );
  }

  loadAttendanceHistory() {
    this.apiService.getStudentAttendance(this.currentUser.roleId).subscribe(
      (data: any) => {
        this.attendanceHistory = data;
        this.calculateSummary();
      },
      error => console.error('Error loading attendance history:', error)
    );
  }

  loadStudentData() {
    this.loading = true;
    
    // Load all classes (this should only return student's classes)
    this.apiService.getClasses().subscribe({
      next: (data: any) => {
        this.allClasses = data;
        console.log('Student classes loaded:', this.allClasses.length); // Debug log
      },
      error: (error) => {
        console.error('Error loading student classes:', error);
      }
    });

    // Load upcoming classes
    this.apiService.getUpcomingClasses().subscribe({
      next: (data: any) => {
        this.upcomingClasses = data;
        console.log('Upcoming classes:', this.upcomingClasses.length); // Debug log
      },
      error: (error) => {
        console.error('Error loading upcoming classes:', error);
      }
    });

    // Load attendance history
    if (this.currentUser?.roleId) {
      this.apiService.getStudentAttendance(this.currentUser.roleId).subscribe({
        next: (data: any) => {
          this.attendanceHistory = data;
          this.calculateSummary();
          this.loading = false;
          
          // Debug: Check if attendance history matches classes
          console.log('Attendance history count:', this.attendanceHistory.length);
          console.log('All classes count:', this.allClasses.length);
          
          // Filter classes to only show those with attendance records
          this.filterClassesWithAttendance();
        },
        error: (error) => {
          console.error('Error loading attendance history:', error);
          this.loading = false;
        }
      });
    }
  }

  // Filter classes to show only those the student has attended or is enrolled in
  filterClassesWithAttendance() {
    if (this.attendanceHistory.length > 0 && this.allClasses.length > 0) {
      // Get class IDs from attendance history
      const attendedClassIds = this.attendanceHistory.map(record => record.class_id);
      
      // Filter classes to only include those in attendance history
      this.allClasses = this.allClasses.filter(classItem => 
        attendedClassIds.includes(classItem.id)
      );
      
      console.log('Filtered classes count:', this.allClasses.length);
    }
  }

  calculateSummary() {
    this.attendanceSummary.totalClasses = this.attendanceHistory.length;
    this.attendanceSummary.present = this.attendanceHistory.filter(r => r.is_present).length;
    this.attendanceSummary.absent = this.attendanceHistory.filter(r => !r.is_present).length;
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5); // Format HH:MM
  }
// Helper method to get class name from class ID
getClassName(classId: number): string {
  const classItem = this.allClasses.find(c => c.id === classId);
  return classItem?.class_name || 'Class #' + classId;
}


}