import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment.development';

export type TaskBucket = 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskType = 'MESSAGE' | 'CALL' | 'APPOINTMENT_CONFIRMATION' | 'RESCHEDULE' | 'PAYMENT' | 'AI_REVIEW' | 'STAGE_UPDATE' | 'MANUAL';
export interface TaskSummary { dueToday: number; highPriorityToday: number; overdue: number; dueThisWeek: number; aiLinkedOpen: number; }
export interface Task {
  id: number;
  conversationId: number | null;
  appointmentId: number | null;
  contactName: string | null;
  contactPhone: string | null;
  currentStage: string | null;
  assigneeUserUuid: string | null;
  assigneeUserName: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: 'OPEN' | 'COMPLETED' | 'CANCELLED';
  source: 'MANUAL' | 'FOLLOW_UP' | string;
  sourceReference: string | null;
  aiLinked: boolean;
  dueAt: string | null;
  completedAt: string | null;
  completedByUserUuid: string | null;
  completedByUserName: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface TaskPayload {
  title: string; description: string; type: TaskType; priority: TaskPriority;
  assigneeUserUuid: string | null; dueAt: string | null; aiLinked: boolean;
  conversationId?: number | null; appointmentId?: number | null;
}
export interface TaskFilters {
  assigneeUserUuid?: string; priority?: TaskPriority | ''; type?: TaskType | '';
  stageId?: number | null; mine?: boolean; conversationId?: number; status?: Task['status'];
}
@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly url = `${environment.apiBaseUrl}/api/v1/tasks`;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private get options() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  summary() { return firstValueFrom(this.http.get<TaskSummary>(`${this.url}/summary`, this.options)); }
  list(bucket: TaskBucket, filters: TaskFilters = {}) {
    let params = new HttpParams().set('bucket', bucket).set('size', 200);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    });
    return firstValueFrom(this.http.get<Task[]>(this.url, { ...this.options, params }));
  }
  create(payload: TaskPayload) { return firstValueFrom(this.http.post<Task>(this.url, payload, this.options)); }
  update(id: number, payload: Partial<TaskPayload>) { return firstValueFrom(this.http.patch<Task>(`${this.url}/${id}`, payload, this.options)); }
  action(id: number, action: 'complete' | 'reopen' | 'cancel') {
    return firstValueFrom(this.http.post<Task>(`${this.url}/${id}/${action}`, {}, this.options));
  }
  bulkComplete(taskIds: number[]) {
    return firstValueFrom(this.http.post<Task[]>(`${this.url}/bulk-complete`, { taskIds }, this.options));
  }
}
