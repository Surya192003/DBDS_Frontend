import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css']
})
export class InstructorDashboardComponent implements OnInit, OnDestroy {
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
  loadingStudents: boolean = false;  // separate loader for students modal
  private subscriptions: Subscription[] = [];

  tagStatusMap: { [classId: number]: { tagged_in: boolean, tagged_out: boolean } } = {};



  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData() {
    this.loadClasses();
    this.loadMonthlyPerformance();
    this.loadActiveStudents();
  }

  loadClasses() {
    this.loading = true;
    const sub = this.apiService.getClasses().subscribe({
      next: (data: any) => {
        console.log('Raw classes data:', data);
        // 🔧 FIX: Handle both array and object with rows property
        if (Array.isArray(data)) {
          this.classes = data;
        } else if (data?.rows && Array.isArray(data.rows)) {
          this.classes = data.rows;
        } else if (data?.data && Array.isArray(data.data)) {
          this.classes = data.data;
        } else {
          this.classes = [];
        }
        this.calculateStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.classes = [];
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  calculateStatistics() {
    this.totalClasses = this.classes.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.completedClasses = this.classes.filter(c => {
      const d = new Date(c.class_date);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }).length;

    this.upcomingClasses = this.classes.filter(c => {
      const d = new Date(c.class_date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    }).length;
  }

  loadMonthlyPerformance() {
    if (!this.currentUser?.instructor_id) return;
    const sub = this.apiService.getInstructorMonthlyPerformance(this.currentUser.instructor_id).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) this.monthlyPerformance = data;
        else if (data?.rows) this.monthlyPerformance = data.rows;
        else this.monthlyPerformance = [];
      },
      error: (err) => {
        console.error('Monthly performance error:', err);
        this.monthlyPerformance = [];
      }
    });
    this.subscriptions.push(sub);
  }

  loadActiveStudents() {
    const sub = this.apiService.getActiveStudents().subscribe({
      next: (data: any) => {

        if (Array.isArray(data)) this.activeStudents = data;
        else if (data?.rows) this.activeStudents = data.rows;
        else this.activeStudents = [];

        this.totalStudents = this.activeStudents.length;
        console.log('Active students raw:', data);
      },
      error: (err) => {
        console.error('Active students error:', err);
        this.activeStudents = [];
        this.totalStudents = 0;
      }
    });
    this.subscriptions.push(sub);
  }

  loadClassStudents(classId: number) {
    this.loadingStudents = true;
    const sub = this.apiService.getClassStudents(classId).subscribe({
      next: (data: any) => {
        console.log('Full response:', data);  // 🔍 Check the actual shape

        let students = [];
        if (Array.isArray(data)) {
          students = data;
        } else if (data?.rows && Array.isArray(data.rows)) {
          students = data.rows;
        } else if (data?.data && Array.isArray(data.data)) {
          students = data.data;
        } else if (data?.students && Array.isArray(data.students)) {
          students = data.students;
        }

        this.classStudents = students.map((s: any) => {
          const studentId = s.student_id ?? s.id ?? 0;
          if (studentId === 0) {
            console.error('Student missing ID:', s);
          }
          return {
            student_id: studentId,
            name: s.name || s.student_name,
            student_name: s.name || s.student_name,
            email: s.email,
            is_present: s.is_present ?? s.present_status ?? false
          };
        });

        this.prepareAttendanceForm();
        this.loadingStudents = false;

        if (students.length === 0) {
          console.warn(`No students found for class ${classId}`);
        }
      },
      error: (err) => {
        console.error('Error loading class students:', err);
        this.classStudents = [];
        this.loadingStudents = false;
        alert(`Could not load students. Check console for details.`);
      }
    });
    this.subscriptions.push(sub);
  }

  prepareAttendanceForm() {
  const group: any = {};
  this.classStudents.forEach(student => {
    if (student.student_id) {
      group[`student_${student.student_id}`] = new FormControl(!!student.is_present);
    }
  });
  this.attendanceForm = new FormGroup(group);
}

  getAttendanceControl(studentId: number): FormControl {
    const key = `student_${studentId}`;
    if (this.attendanceForm && this.attendanceForm.contains(key)) {
      return this.attendanceForm.get(key) as FormControl;
    }
    // Fallback: return a disabled control to avoid crashes
    console.warn(`Missing control for student ${studentId}, creating fallback`);
    const fallback = new FormControl(false);
    fallback.disable();
    return fallback;
  }

  openSongModal(classItem: any) {
    if (!classItem || !classItem.id) {
      alert('Invalid class selected');
      return;
    }
    this.selectedClass = classItem;
    this.songLink = classItem.song_link || '';
    this.modalService.openModal('songModal');
  }

  updateSongLink() {
    if (!this.selectedClass || !this.selectedClass.id) {
      alert('No class selected');
      return;
    }
    if (!this.songLink || this.songLink.trim() === '') {
      alert('Please enter a valid song link');
      return;
    }

    this.loading = true;
    const sub = this.apiService.updateSongLink(this.selectedClass.id, this.songLink).subscribe({
      next: (response) => {
        console.log('Song link updated:', response);
        this.loadClasses();  // refresh class list
        this.modalService.closeModal('songModal');
        alert('Song link updated successfully!');
        this.loading = false;
      },
      error: (err) => {
        console.error('Update song error:', err);
        alert('Failed to update song link. Check console for details.\n' + (err.message || ''));
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  openAttendanceModal(classItem: any) {
  if (!classItem?.id) {
    alert('Invalid class');
    return;
  }
  this.selectedClass = classItem;
  this.classStudents = [];
  this.attendanceForm = new FormGroup({});
  this.loadingStudents = true;
  this.modalService.openModal('attendanceModal'); // open modal immediately (shows spinner)
  this.loadClassStudents(classItem.id);
}

  submitAttendance() {
    if (!this.selectedClass || !this.selectedClass.id) {
      alert('No class selected');
      return;
    }
    if (this.classStudents.length === 0) {
      alert('No students found for this class');
      return;
    }

    this.markingAttendance = true;

    // Build attendance data correctly
    const attendanceRecords = this.classStudents.map(student => ({
      student_id: student.student_id,
      is_present: this.getAttendanceControl(student.student_id)?.value || false
    }));

    const attendanceData = {
      class_id: this.selectedClass.id,
      attendance_data: attendanceRecords
    };

    console.log('Submitting attendance:', attendanceData);

    const sub = this.apiService.markBulkAttendance(attendanceData).subscribe({
      next: (response) => {
        console.log('Attendance marked:', response);
        this.markingAttendance = false;
        this.modalService.closeModal('attendanceModal');
        this.loadClasses();  // refresh to show updated attendance count
        alert('Attendance marked successfully!');
      },
      error: (err) => {
        console.error('Attendance error:', err);
        this.markingAttendance = false;
        alert('Failed to mark attendance: ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
    this.subscriptions.push(sub);
  }

  closeAttendanceModal() {
    this.modalService.closeModal('attendanceModal');
  }

  closeSongModal() {
    this.modalService.closeModal('songModal');
  }

  getAttendancePercentage(student: any): number {
    const total = Number(student.total_attendance_count) || 0;
    const attended = Number(student.attended_count) || 0;
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  }

  getStatusClass(date: string): string {
    const classDate = new Date(date);
    classDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (classDate < today) return 'completed';
    if (classDate.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  }

  getStatusText(date: string): string {
    const status = this.getStatusClass(date);
    if (status === 'completed') return 'COMPLETED';
    if (status === 'today') return 'ACTIVE_TODAY';
    return 'UPCOMING';
  }

  // Helper for template checkbox binding
  isStudentPresent(studentId: number): boolean {
    const control = this.getAttendanceControl(studentId);
    return control ? control.value : false;
  }

  loadTagStatus(classId: number) {
  this.apiService.getTagStatus(classId).subscribe({
    next: (status) => this.tagStatusMap[classId] = status,
    error: (err) => console.error('Tag status error', err)
  });
}

tagIn(classId: number) {
  this.apiService.tagIn(classId).subscribe({
    next: () => {
      this.loadTagStatus(classId);
      alert('Tagged in successfully');
    },
    error: (err) => alert(err.error?.message || 'Tag in failed')
  });
}

tagOut(classId: number) {
  this.apiService.tagOut(classId).subscribe({
    next: () => {
      this.loadTagStatus(classId);
      alert('Tagged out successfully');
    },
    error: (err) => alert(err.error?.message || 'Tag out failed')
  });
}
  
}