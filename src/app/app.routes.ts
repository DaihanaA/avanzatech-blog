
import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { CreatePostComponent } from './components/create-post/create-post.component';
import { EditPostComponent } from './components/edit-post/edit-post.component';


export const routes: Routes = [
  {path:'home', component: HomeComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'posts/:id',
    loadComponent: () => import('./components/post-detail/post-detail.component').then(m => m.PostDetailComponent),
    data: { renderMode: 'server' },
  },
  {
    path: 'edit-post/:id',
    loadComponent: () => import('./components/edit-post/edit-post.component').then(m => m.EditPostComponent),
    data: { renderMode: 'server' },

  },
  { path:'create-post', component: CreatePostComponent },


];


