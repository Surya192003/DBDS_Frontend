import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css']
})
export class InstructorDashboardComponent implements OnInit {
  classes: any[] = [];
  monthlyPerformance: any[] = [];
  activeStudents: any[] = [];
  classStudents: any[] = [];
  
  selectedClass: any = null;
  songLink: string = '';
  currentUser: any;
  
  // Statistics
  totalClasses: number = 0;
  completedClasses: number = 0;
  upcomingClasses: number = 0;
  totalStudents: number = 0;
  attendanceRate: number = 0;
  
  // Attendance form
  attendanceForm: FormGroup = new FormGroup({});
  markingAttendance: boolean = false;
  loading: boolean = false;
  
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.currentUser = this.authService.currentUser;
    this.attendanceForm = this.fb.group({});
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loadClasses();
    this.loadMonthlyPerformance();
    this.loadActiveStudents();
  }

  loadClasses() {
    this.loading = true;
    this.apiService.getClasses().subscribe({
      next: (data: any) => {
        // Handle both array and object responses
        this.classes = Array.isArray(data) ? data : (data?.rows || []);
        this.calculateStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.classes = [];
        this.loading = false;
      }
    });
  }

  calculateStatistics() {
    // Calculate total classes
    this.totalClasses = this.classes.length;
    
    // Calculate completed classes (classes with date in past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.completedClasses = this.classes.filter(classItem => {
      const classDate = new Date(classItem.class_date);
      classDate.setHours(0, 0, 0, 0);
      return classDate < today;
    }).length;
    
    // Calculate upcoming classes (classes with date in future or today)
    this.upcomingClasses = this.classes.filter(classItem => {
      const classDate = new Date(classItem.class_date);
      classDate.setHours(0, 0, 0, 0);
      return classDate >= today;
    }).length;
  }

  loadMonthlyPerformance() {
    if (this.currentUser?.instructor_id) {
      this.apiService.getInstructorMonthlyPerformance(this.currentUser.instructor_id).subscribe({
        next: (data: any) => {
          this.monthlyPerformance = Array.isArray(data) ? data : (data?.rows || []);
        },
        error: (error) => {
          console.error('Error loading monthly performance:', error);
          this.monthlyPerformance = [];
        }
      });
    }
  }

  loadActiveStudents() {
    this.apiService.getActiveStudents().subscribe({
      next: (data: any) => {
        this.activeStudents = Array.isArray(data) ? data : (data?.rows || []);
        this.totalStudents = this.activeStudents.length;
      },
      error: (error) => {
        console.error('Error loading active students:', error);
        this.activeStudents = [];
      }
    });
  }

  loadClassStudents(classId: number) {
    this.apiService.getClassStudents(classId).subscribe({
      next: (data: any) => {
        this.classStudents = Array.isArray(data) ? data : (data?.rows || []);
        this.prepareAttendanceForm();
      },
      error: (error) => {
        console.error('Error loading class students:', error);
        this.classStudents = [];
      }
    });
  }

  prepareAttendanceForm() {
    const formGroup: { [key: string]: FormControl } = {};
    this.classStudents.forEach(student => {
      formGroup[`student_${student.student_id}`] = new FormControl(student.is_present || false);
    });
    this.attendanceForm = new FormGroup(formGroup);
  }

  // Helper method to get form control safely
  getAttendanceControl(studentId: number): FormControl {
    const control = this.attendanceForm.get(`student_${studentId}`);
    return control as FormControl;
  }

  openSongModal(classItem: any) {
    this.selectedClass = classItem;
    this.songLink = classItem.song_link || '';
    this.modalService.openModal('songModal');
  }

  updateSongLink() {
    if (this.selectedClass && this.songLink) {
      this.apiService.updateSongLink(this.selectedClass.id, this.songLink).subscribe({
        next: () => {
          this.loadClasses();
          this.modalService.closeModal('songModal');
          alert('Song link updated successfully!');
        },
        error: (error) => {
          console.error('Error updating song link:', error);
          alert('Failed to update song link: ' + error.message);
        }
      });
    }
  }

  openAttendanceModal(classItem: any) {
    this.selectedClass = classItem;
    this.loadClassStudents(classItem.id);
    this.modalService.openModal('attendanceModal');
  }

  submitAttendance() {
    if (this.attendanceForm.valid && this.selectedClass) {
      this.markingAttendance = true;
      
      const attendanceData = {
        class_id: this.selectedClass.id,
        attendance_data: this.classStudents.map(student => ({
          student_id: student.student_id,
          is_present: this.getAttendanceControl(student.student_id)?.value || false
        }))
      };
      
      this.apiService.markBulkAttendance(attendanceData).subscribe({
        next: () => {
          this.markingAttendance = false;
          this.modalService.closeModal('attendanceModal');
          this.loadClasses();
          alert('Attendance marked successfully!');
        },
        error: (error) => {
          this.markingAttendance = false;
          console.error('Error marking attendance:', error);
          alert('Failed to mark attendance: ' + error.message);
        }
      });
    }
  }

  closeAttendanceModal() {
    this.modalService.closeModal('attendanceModal');
  }

  closeSongModal() {
    this.modalService.closeModal('songModal');
  }

  // Helper methods for template
  getAttendancePercentage(student: any): number {
    if (!student.total_attendance_count || student.total_attendance_count === 0) return 0;
    const attended = student.attended_count || 0;
    return Math.round((attended / student.total_attendance_count) * 100);
  }

  getStatusClass(date: string): string {
    const classDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (classDate < today) return 'completed';
    if (classDate.toDateString() === today.toDateString()) return 'today';
    return 'upcoming';
  }

  // Get checkbox checked state
  isStudentPresent(studentId: number): boolean {
    const control = this.getAttendanceControl(studentId);
    return control ? control.value : false;
  }
  getStatusText(date: any) {
  const status = this.getStatusClass(date);
  if (status === 'completed') return 'COMPLETED';
  if (status === 'today') return 'ACTIVE_TODAY';
  return 'UPCOMING';
}

}