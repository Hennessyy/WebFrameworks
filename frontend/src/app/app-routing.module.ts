import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskViewComponent } from './pages/task-view/task-view.component';
import { NewTaskComponent } from './pages/new-task/new-task.component';
import { NewWorkitemComponent } from './pages/new-workitem/new-workitem.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { EditTaskComponent } from './pages/edit-task/edit-task.component';
import { EditItemComponent } from './pages/edit-item/edit-item.component';


const routes: Routes = [
{ path: '', redirectTo: 'tasks', pathMatch: 'full'},
{ path: 'new-task', component: NewTaskComponent},
{ path: 'edit-task/:taskId', component: EditTaskComponent},
{ path: 'tasks', component: TaskViewComponent},
{ path: 'tasks/:taskId', component: TaskViewComponent},
{ path: 'tasks/:taskId/new-item', component: NewWorkitemComponent},
{ path: 'tasks/:taskId/edit-item/:itemId', component: EditItemComponent},
{ path: 'login', component: LoginPageComponent},
{ path: 'signup', component: SignupPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
