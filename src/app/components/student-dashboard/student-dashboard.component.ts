import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  template: `
    <div class="row">
      <div class="col-12">
        <h3>Student Dashboard</h3>
        <hr>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Upcoming Classes</h5>
            <div *ngIf="upcomingClasses.length === 0" class="text-muted">
              No upcoming classes
            </div>
            <div class="table-responsive" *ngIf="upcomingClasses.length > 0">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Instructor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let classItem of upcomingClasses">
                    <td>{{classItem.class_date | date}}</td>
                    <td>{{classItem.class_time}}</td>
                    <td>{{classItem.instructor_name}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Attendance Summary</h5>
            <div class="text-center">
              <h2>{{attendanceSummary.totalClasses || 0}} Classes</h2>
              <div class="row mt-3">
                <div class="col-6">
                  <div class="card bg-success text-white">
                    <div class="card-body">
                      <h4>{{attendanceSummary.present || 0}}</h4>
                      <p class="mb-0">Present</p>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="card bg-danger text-white">
                    <div class="card-body">
                      <h4>{{attendanceSummary.absent || 0}}</h4>
                      <p class="mb-0">Absent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Attendance History</h5>
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    <th>Song Link</th>
                    <th>Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let record of attendanceHistory">
                    <td>{{record.class_date | date}}</td>
                    <td>{{record.class_time}}</td>
                    <td>{{record.instructor_name}}</td>
                    <td>
                      <span [class]="record.is_present ? 'badge bg-success' : 'badge bg-danger'">
                        {{record.is_present ? 'Present' : 'Absent'}}
                      </span>
                    </td>
                    <td>
                      <a *ngIf="record.song_link && record.is_present" 
                         [href]="record.song_link" target="_blank">
                        Listen
                      </a>
                      <span *ngIf="!record.song_link || !record.is_present" class="text-muted">
                        -
                      </span>
                    </td>
                    <td>{{record.check_in_time | date:'short'}}</td>
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

  calculateSummary() {
    this.attendanceSummary.totalClasses = this.attendanceHistory.length;
    this.attendanceSummary.present = this.attendanceHistory.filter(r => r.is_present).length;
    this.attendanceSummary.absent = this.attendanceHistory.filter(r => !r.is_present).length;
  }
}