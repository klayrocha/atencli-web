/** Compara somente dados editáveis com o último estado confirmado pela API. */
export class ConfigurationChanges {
  private baseline: string | null = null;
  constructor(private readonly read: () => unknown, readonly save: () => Promise<boolean>) {}
  snapshot(): string { return JSON.stringify(this.read()); }
  markSaved(snapshot = this.snapshot()): void { this.baseline = snapshot; }
  hasChanges(): boolean { return this.baseline !== null && this.snapshot() !== this.baseline; }
}
