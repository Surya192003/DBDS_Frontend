import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
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
today: string | number | Date | undefined;

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