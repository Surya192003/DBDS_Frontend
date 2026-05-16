import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-groups-management',
  templateUrl: './groups-management.component.html',
  styleUrls: ['./groups-management.component.css']
})
export class GroupsManagementComponent implements OnInit {
  groups: any[] = [];
  activeStudents: any[] = [];
  selectedGroup: any = null;
  groupStudents: any[] = [];

  loading: boolean = false;
  creatingGroup: boolean = false;
  addingStudent: boolean = false;

  // Modal visibility flags (replaces ModalService)
  showCreateModal = false;
  showDetailsModal = false;
  showAddStudentModal = false;

  groupForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.groupForm = this.fb.group({
      group_name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadGroups();
    this.loadActiveStudents();
  }

  // ------------------------------
  // Data loading
  // ------------------------------
  loadGroups() {
    this.loading = true;
    this.apiService.getGroups().subscribe({
      next: (data: any) => {
        this.groups = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.loading = false;
      }
    });
  }

  loadActiveStudents() {
    this.apiService.getActiveStudents().subscribe({
      next: (data: any) => {
        this.activeStudents = data;
      },
      error: (error) => {
        console.error('Error loading active students:', error);
      }
    });
  }

  loadGroupDetails(groupId: number) {
    this.apiService.getGroupDetails(groupId).subscribe({
      next: (data: any) => {
        this.selectedGroup = data;
        this.groupStudents = data.students || [];
      },
      error: (error) => {
        console.error('Error loading group details:', error);
      }
    });
  }

  // ------------------------------
  // Modal control (replaces ModalService)
  // ------------------------------
  openCreateGroupModal() {
    this.groupForm.reset();
    this.showCreateModal = true;
  }

  closeCreateGroupModal() {
    this.showCreateModal = false;
  }

  openGroupDetailsModal(group: any) {
    this.selectedGroup = group;
    this.loadGroupDetails(group.id);
    this.showDetailsModal = true;
  }

  closeGroupDetailsModal() {
    this.showDetailsModal = false;
    this.selectedGroup = null;
    this.groupStudents = [];
  }

  openAddStudentModal() {
    // Refresh active students list before opening
    this.loadActiveStudents();
    this.showAddStudentModal = true;
  }

  closeAddStudentModal() {
    this.showAddStudentModal = false;
  }

  // Close modal when clicking on the overlay background
  closeModalOnOverlay(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.closeCreateGroupModal();
      this.closeGroupDetailsModal();
      this.closeAddStudentModal();
    }
  }

  // ------------------------------
  // Business logic
  // ------------------------------
  createGroup() {
    if (this.groupForm.valid) {
      this.creatingGroup = true;
      this.apiService.createGroup(this.groupForm.value).subscribe({
        next: () => {
          this.creatingGroup = false;
          this.closeCreateGroupModal();
          this.loadGroups();
          alert('Group created successfully!');
        },
        error: (error) => {
          this.creatingGroup = false;
          console.error('Error creating group:', error);
          alert('Failed to create group: ' + error.message);
        }
      });
    }
  }

  addStudentToGroup(student: any) {
    if (!this.selectedGroup) return;
    this.addingStudent = true;
    this.apiService.addStudentToGroup(this.selectedGroup.id, student.student_id).subscribe({
      next: () => {
        this.addingStudent = false;
        this.loadGroupDetails(this.selectedGroup.id);
        alert('Student added to group!');
      },
      error: (error) => {
        this.addingStudent = false;
        console.error('Error adding student:', error);
        alert('Failed to add student: ' + error.message);
      }
    });
  }

  removeStudentFromGroup(studentId: number) {
    if (!this.selectedGroup) return;
    if (confirm('Remove this student from the group?')) {
      this.apiService.removeStudentFromGroup(this.selectedGroup.id, studentId).subscribe({
        next: () => {
          this.loadGroupDetails(this.selectedGroup.id);
          alert('Student removed from group!');
        },
        error: (error) => {
          console.error('Error removing student:', error);
          alert('Failed to remove student: ' + error.message);
        }
      });
    }
  }

  deleteGroup(groupId: number) {
    if (confirm('Delete this group? This will not delete the students.')) {
      this.apiService.deleteGroup(groupId).subscribe({
        next: () => {
          this.loadGroups();
          this.closeGroupDetailsModal();
          alert('Group deleted!');
        },
        error: (error) => {
          console.error('Error deleting group:', error);
          alert('Failed to delete group: ' + error.message);
        }
      });
    }
  }

  isStudentInGroup(studentId: number): boolean {
    return this.groupStudents.some(s => s.student_id === studentId);
  }
}