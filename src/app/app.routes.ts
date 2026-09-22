import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { WizardStep1AboutComponent } from './pages/wizard-step-1-about/wizard-step-1-about.component';
import { WizardStep2SpecialtyComponent } from './pages/wizard-step-2-specialty/wizard-step-2-specialty.component';
import { WizardStep3ServicesComponent } from './pages/wizard-step-3-services/wizard-step-3-services.component';
import { WizardStep4ScheduleComponent } from './pages/wizard-step-4-schedule/wizard-step-4-schedule.component';
import { WizardStep5TeamComponent } from './pages/wizard-step-5-team/wizard-step-5-team.component';
import { WizardStep6WhatsappComponent } from './pages/wizard-step-6-whatsapp/wizard-step-6-whatsapp.component';
import { WizardStep7AiComponent } from './pages/wizard-step-7-ai/wizard-step-7-ai.component';
import { WizardStep8ReviewComponent } from './pages/wizard-step-8-review/wizard-step-8-review.component';
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
      { path: 'wizard-step-1-aboult', component: WizardStep1AboutComponent },
      { path: 'wizard-step-2-specialty', component: WizardStep2SpecialtyComponent },
      { path: 'wizard-step-3-services', component: WizardStep3ServicesComponent },
      { path: 'wizard-step-4-schedule', component: WizardStep4ScheduleComponent },
      { path: 'wizard-step-5-team', component: WizardStep5TeamComponent },
      { path: 'wizard-step-6-whatsapp', component: WizardStep6WhatsappComponent },
      { path: 'configuracoes/whatsapp', component: WizardStep6WhatsappComponent },
      { path: 'conversas', component: DashboardComponent },
      { path: 'contatos', component: DashboardComponent },
      { path: 'etapas', component: DashboardComponent },
      { path: 'agenda', component: DashboardComponent },
      { path: 'tarefas', component: DashboardComponent },
      { path: 'resultados', component: DashboardComponent },
      { path: 'ia', component: WizardStep7AiComponent },
      { path: 'wizard-step-7-ai', redirectTo: 'ia', pathMatch: 'full' },
      { path: 'wizard-step-8-review', component: WizardStep8ReviewComponent },
      { path: 'equipe', component: DashboardComponent },
      { path: 'configuracoes', component: DashboardComponent },
      { path: 'ajuda', component: DashboardComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
