import { Injectable, signal } from '@angular/core';
import { ConversationsService } from './conversations.service';

/** Conversations the AI handed to the team and nobody took yet. Shown in the menu and refreshed periodically. */
@Injectable({ providedIn: 'root' })
export class WaitingConversationsService {
  static readonly REFRESH_MS = 45_000;
  readonly count = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;
  private watchers = 0;

  constructor(private api: ConversationsService) {}

  async refresh(): Promise<void> {
    try { this.count.set(await this.api.waitingCount()); }
    catch { /* keeps the last value; the next refresh tries again */ }
  }

  /** Starts the periodic refresh; every watch() must be paired with an unwatch(). */
  watch(): void {
    this.watchers++;
    if (this.timer) return;
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), WaitingConversationsService.REFRESH_MS);
  }

  unwatch(): void {
    this.watchers = Math.max(0, this.watchers - 1);
    if (this.watchers === 0 && this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}
