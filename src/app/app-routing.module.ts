import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { InstructorDashboardComponent } from './components/instructor-dashboard/instructor-dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { GroupsManagementComponent } from './components/groups-management/groups-management.component';
import { ProfileComponent } from './components/profile/profile.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },   // ← now dashboard is home
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },        // public & private
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'admin/groups', component: GroupsManagementComponent, canActivate: [AuthGuard, RoleGuard], data: { role: 'ADMIN' } },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'instructor', component: InstructorDashboardComponent, canActivate: [AuthGuard], data: { role: 'INSTRUCTOR' } },
  { path: 'student', component: StudentDashboardComponent, canActivate: [AuthGuard], data: { role: 'STUDENT' } },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }