import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  classes: any[] = [];
  payments: any[] = [];
  studentStats: any[] = [];
  activeInstructors: any[] = [];
  filteredUsers: any[] = [];
  filteredStudentStats: any[] = [];
  instructorStats: any[] = [];

  selectedMonth: string = new Date().toISOString().slice(0, 7);
  selectedInstructor: any = null;
  userSearchTerm: string = '';
  studentSearchTerm: string = '';

  creatingClass: boolean = false;
  loadingClasses: boolean = false;
  loadingPayments: boolean = false;
  calculatingPayments: boolean = false;

  errorMessage: string = '';
  successMessage: string = '';
  markingAttendance: boolean = false;
  activeStudents: any[] = [];
  assigningStudent: boolean = false;
  selectedStudent: any = null;
  selectedClass: any = null;
loadingStudents: boolean = false;


  today: string = new Date().toISOString().split('T')[0];

  classForm: FormGroup;
  payRateForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public modalService: ModalService
  ) {
    // Initialize forms
    this.classForm = this.fb.group({
      class_date: ['', Validators.required],
      class_time: ['', Validators.required],
      instructor_id: ['']
    });

    this.payRateForm = this.fb.group({
      payRate: [0, [Validators.required, Validators.min(0)]]
    });
  }

 ngOnInit() {
  this.loadAllData();
  this.loadActiveStudents(); // Add this
}

  loadAllData() {
    this.loadUsers();
    this.loadClasses();
    this.loadPayments();
    this.loadStudentStats();
    this.loadInstructorStats();
    this.loadActiveInstructors();
  }

  loadUsers() {
    this.apiService.getUsers().subscribe({
      next: (data: any) => {
        this.users = data;
        this.filteredUsers = [...data];
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Failed to load users: ' + error.message;
      }
    });
  }

  loadClasses() {
    this.loadingClasses = true;
    // Use regular getClasses instead of getAllClassesForAdmin if route doesn't exist
    this.apiService.getClasses().subscribe({
      next: (data: any) => {
        this.classes = data;
        this.loadingClasses = false;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.errorMessage = 'Failed to load classes: ' + error.message;
        this.loadingClasses = false;
      }
    });
  }

  // Update the loadActiveInstructors method
  loadActiveInstructors() {
    this.apiService.getUsers().subscribe({
      next: (data: any) => {
        console.log('All users data:', data);

        // Filter instructors
        const instructors = data.filter((user: any) =>
          user.role === 'INSTRUCTOR' && user.is_active
        );

        console.log('Instructors found:', instructors);

        // For instructors without instructor_id, we need to create the record
        const instructorsNeedingFix = instructors.filter((instructor: any) =>
          !instructor.instructor_id
        );

        if (instructorsNeedingFix.length > 0) {
          console.warn('Found instructors without instructor records:', instructorsNeedingFix);

          // You could call an API here to fix these records
          instructorsNeedingFix.forEach((instructor: any) => {
            console.log(`Instructor ${instructor.name} needs instructor record created`);
          });
        }

        // Only show instructors with instructor_id
        this.activeInstructors = instructors
          .filter((instructor: any) => instructor.instructor_id)
          .map((instructor: any) => ({
            instructor_id: instructor.instructor_id,
            user_id: instructor.id,
            name: instructor.name,
            email: instructor.email,
            pay_per_class: instructor.pay_per_class || 50
          }));

        console.log('Active instructors ready for dropdown:', this.activeInstructors);

        // If still empty, show warning
        if (this.activeInstructors.length === 0 && instructors.length > 0) {
          this.errorMessage = 'Instructors found but missing instructor records. Please fix database.';
        }
      },
      error: (error) => {
        console.error('Error loading instructors:', error);
        this.activeInstructors = [];
      }
    });
  }
  loadPayments() {
    this.loadingPayments = true;
    this.apiService.getMonthlyPayments(this.selectedMonth).subscribe({
      next: (data: any) => {
        this.payments = data;
        this.loadingPayments = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.loadingPayments = false;
      }
    });
  }

  loadStudentStats() {
    this.apiService.getStudentStats().subscribe({
      next: (data: any) => {
        this.studentStats = data;
        this.filteredStudentStats = [...data];
      },
      error: (error) => {
        console.error('Error loading student stats:', error);
      }
    });
  }

  loadInstructorStats() {
    this.apiService.getInstructorStats().subscribe({
      next: (data: any) => {
        this.instructorStats = data;
      },
      error: (error) => {
        console.error('Error loading instructor stats:', error);
      }
    });
  }

  // Modal Methods
  openCreateClassModal() {
    this.classForm.reset();
    this.modalService.openModal('createClassModal');
  }

  closeCreateClassModal() {
    this.modalService.closeModal('createClassModal');
  }

  openPayRateModal(user: any) {
    this.selectedInstructor = user;
    this.payRateForm.patchValue({ payRate: user.pay_per_class || 50 });
    this.modalService.openModal('payRateModal');
  }

  closePayRateModal() {
    this.modalService.closeModal('payRateModal');
  }

  // Form Methods
  setFormDisabled(isDisabled: boolean) {
    if (isDisabled) {
      this.classForm.disable();
    } else {
      this.classForm.enable();
    }
  }

  // Class Management
  createClass() {
    if (this.classForm.valid) {
      this.creatingClass = true;
      this.setFormDisabled(true);

      const classData = this.classForm.value;

      this.apiService.createClass(classData).subscribe({
        next: (response: any) => {
          this.creatingClass = false;
          this.setFormDisabled(false);
          this.classForm.reset();
          this.loadClasses();
          this.closeCreateClassModal();
          this.successMessage = 'Class created successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.creatingClass = false;
          this.setFormDisabled(false);
          console.error('Error creating class:', error);
          this.errorMessage = 'Failed to create class: ' + error.message;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  deleteClass(classId: number) {
    if (confirm('Are you sure you want to delete this class?\n\nThis will also delete all attendance records.')) {
      this.apiService.deleteClass(classId).subscribe({
        next: () => {
          this.loadClasses();
          this.successMessage = 'Class deleted successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting class:', error);
          this.errorMessage = 'Failed to delete class: ' + error.message;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  // User Management
  toggleUserStatus(userId: number) {
    this.apiService.toggleUserStatus(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.successMessage = 'User status updated!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        this.errorMessage = 'Failed to update user status: ' + error.message;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  updatePayRate() {
    if (this.payRateForm.valid && this.selectedInstructor) {
      const payRate = this.payRateForm.get('payRate')?.value;
      this.apiService.updatePayRate(this.selectedInstructor.instructor_id, payRate).subscribe({
        next: () => {
          this.loadUsers();
          this.closePayRateModal();
          this.successMessage = 'Pay rate updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error updating pay rate:', error);
          this.errorMessage = 'Failed to update pay rate: ' + error.message;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  // Payment Management
  calculatePayments() {
    this.calculatingPayments = true;
    this.apiService.calculateMonthlyPayments(this.selectedMonth).subscribe({
      next: () => {
        this.calculatingPayments = false;
        this.loadPayments();
        this.successMessage = 'Payments calculated successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.calculatingPayments = false;
        console.error('Error calculating payments:', error);
        this.errorMessage = 'Failed to calculate payments: ' + error.message;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  markAsPaid(paymentId: number) {
    this.apiService.markPaymentAsPaid(paymentId).subscribe({
      next: () => {
        this.loadPayments();
        this.successMessage = 'Payment marked as paid!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error marking payment as paid:', error);
        this.errorMessage = 'Failed to mark payment as paid: ' + error.message;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // Search and Filter Methods
  filterUsers() {
    if (!this.userSearchTerm) {
      this.filteredUsers = [...this.users];
      return;
    }

    const term = this.userSearchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  }

  filterStudents() {
    if (!this.studentSearchTerm) {
      this.filteredStudentStats = [...this.studentStats];
      return;
    }

    const term = this.studentSearchTerm.toLowerCase();
    this.filteredStudentStats = this.studentStats.filter(stat =>
      stat.student_name?.toLowerCase().includes(term) ||
      stat.email?.toLowerCase().includes(term)
    );
  }

  // Utility Methods
  getAttendancePercentage(stat: any): number {
    if (!stat.total_classes || stat.total_classes === 0) return 0;
    return Math.round((stat.attended_classes / stat.total_classes) * 100);
  }

  getTotalPayments(): number {
    return this.payments.reduce((total, payment) => total + (payment.total_amount || 0), 0);
  }

  getTotalClasses(): number {
    return this.filteredStudentStats.reduce((total, stat) => total + (stat.total_classes || 0), 0);
  }

  getTotalAttended(): number {
    return this.filteredStudentStats.reduce((total, stat) => total + (stat.attended_classes || 0), 0);
  }

  getTotalMissed(): number {
    return this.filteredStudentStats.reduce((total, stat) => total + (stat.missed_classes || 0), 0);
  }

  getOverallAttendancePercentage(): number {
    const total = this.getTotalClasses();
    const attended = this.getTotalAttended();
    return total > 0 ? Math.round((attended / total) * 100) : 0;
  }

  clearError() {
    this.errorMessage = '';
  }

  clearSuccess() {
    this.successMessage = '';
  }
    loadActiveStudents() {
  this.loadingStudents = true;
  this.apiService.getActiveStudents().subscribe({
    next: (data: any) => {
      console.log('Active students data:', data); // Debug log
      
      if (data && data.length > 0) {
        this.activeStudents = data;
      } else {
        // If no students from API, try to get from users list
        this.loadStudentsFromUsersList();
      }
      this.loadingStudents = false;
    },
    error: (error) => {
      console.error('Error loading active students:', error);
      // Fallback to users list
      this.loadStudentsFromUsersList();
      this.loadingStudents = false;
    }
  });
}

  openAssignStudentModal(classItem: any) {
    this.selectedClass = classItem;
    this.selectedStudent = null;
    this.loadActiveStudents();
    this.modalService.openModal('assignStudentModal');
  }

  assignStudentToClass() {
    if (this.selectedClass && this.selectedStudent) {
      this.assigningStudent = true;
      this.apiService.assignStudentToClass(this.selectedClass.id, this.selectedStudent.student_id).subscribe({
        next: () => {
          this.assigningStudent = false;
          this.modalService.closeModal('assignStudentModal');
          this.loadClasses();
          alert('Student assigned to class successfully!');
        },
        error: (error) => {
          this.assigningStudent = false;
          console.error('Error assigning student:', error);
          alert('Failed to assign student: ' + error.message);
        }
      });
    }
  }


// Fallback method to load students from users list
loadStudentsFromUsersList() {
  this.apiService.getUsers().subscribe({
    next: (data: any) => {
      // Filter active students from users
      const studentUsers = data.filter((user: any) => 
        user.role === 'STUDENT' && user.is_active && user.student_id
      );
      
      this.activeStudents = studentUsers.map((student: any) => ({
        student_id: student.student_id,
        user_id: student.id,
        name: student.name,
        email: student.email
      }));
      
      console.log('Students from users list:', this.activeStudents);
    },
    error: (error) => {
      console.error('Error loading students from users:', error);
      this.activeStudents = [];
    }
  });
}
}