import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { FormBuilder, FormGroup } from '@angular/forms';

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
  
  // Attendance form
  attendanceForm: FormGroup;
  markingAttendance: boolean = false;
  
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
    this.loadClasses();
    if (this.currentUser?.roleId) {
      this.loadMonthlyPerformance();
      this.loadActiveStudents();
    }
  }

  loadClasses() {
    this.apiService.getClasses().subscribe({
      next: (data: any) => {
        this.classes = data;
      },
      error: (error) => console.error('Error loading classes:', error)
    });
  }

  loadMonthlyPerformance() {
    this.apiService.getInstructorMonthlyPerformance(this.currentUser.roleId).subscribe({
      next: (data: any) => {
        this.monthlyPerformance = data;
      },
      error: (error) => console.error('Error loading monthly performance:', error)
    });
  }

  loadActiveStudents() {
    this.apiService.getActiveStudents().subscribe({
      next: (data: any) => {
        this.activeStudents = data;
      },
      error: (error) => console.error('Error loading active students:', error)
    });
  }

  loadClassStudents(classId: number) {
    this.apiService.getClassStudents(classId).subscribe({
      next: (data: any) => {
        this.classStudents = data;
        this.prepareAttendanceForm();
      },
      error: (error) => console.error('Error loading class students:', error)
    });
  }

  prepareAttendanceForm() {
    const formGroup: any = {};
    this.classStudents.forEach(student => {
      formGroup[`student_${student.student_id}`] = [student.is_present || false];
    });
    this.attendanceForm = this.fb.group(formGroup);
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
        error: (error) => console.error('Error updating song link:', error)
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
          is_present: this.attendanceForm.get(`student_${student.student_id}`)?.value || false
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
}