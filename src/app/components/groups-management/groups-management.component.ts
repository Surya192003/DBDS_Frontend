import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService } from '../../services/modal.service';

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
  
  groupForm: FormGroup;
  
  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public modalService: ModalService
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

  openCreateGroupModal() {
    this.groupForm.reset();
    this.modalService.openModal('createGroupModal');
  }

  openGroupDetailsModal(group: any) {
    this.selectedGroup = group;
    this.loadGroupDetails(group.id);
    this.modalService.openModal('groupDetailsModal');
  }

  createGroup() {
    if (this.groupForm.valid) {
      this.creatingGroup = true;
      this.apiService.createGroup(this.groupForm.value).subscribe({
        next: () => {
          this.creatingGroup = false;
          this.modalService.closeModal('createGroupModal');
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
    if (this.selectedGroup) {
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
  }

  removeStudentFromGroup(studentId: number) {
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
          this.modalService.closeModal('groupDetailsModal');
          alert('Group deleted!');
        },
        error: (error) => {
          console.error('Error deleting group:', error);
          alert('Failed to delete group: ' + error.message);
        }
      });
    }
  }

  closeGroupDetailsModal() {
    this.modalService.closeModal('groupDetailsModal');
  }

  closeCreateGroupModal() {
    this.modalService.closeModal('createGroupModal');
  }
  isStudentInGroup(studentId: number): boolean {
  return this.groupStudents.some(s => s.student_id === studentId);
}

}