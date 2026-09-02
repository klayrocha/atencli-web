import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { OAuth2CallbackComponent } from './pages/oauth2-callback/oauth2-callback.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'oauth2/callback',
    component: OAuth2CallbackComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'conversas', component: DashboardComponent },
      { path: 'contatos', component: DashboardComponent },
      { path: 'etapas', component: DashboardComponent },
      { path: 'agenda', component: DashboardComponent },
      { path: 'tarefas', component: DashboardComponent },
      { path: 'resultados', component: DashboardComponent },
      { path: 'ia', component: DashboardComponent },
      { path: 'equipe', component: DashboardComponent },
      { path: 'configuracoes', component: DashboardComponent },
      { path: 'ajuda', component: DashboardComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
