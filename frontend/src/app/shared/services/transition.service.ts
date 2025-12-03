import { Injectable, signal } from '@angular/core';

export type TransitionType = 'admin' | 'worker';

export interface ReportTransitionData {
  buttonX: number;
  buttonY: number;
  buttonWidth: number;
  buttonHeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransitionService {
  private _isTransitioning = signal(false);
  private _transitionType = signal<TransitionType | null>(null);
  private _reportTransitionData = signal<ReportTransitionData | null>(null);
  
  readonly isTransitioning = this._isTransitioning.asReadonly();
  readonly transitionType = this._transitionType.asReadonly();
  readonly reportTransitionData = this._reportTransitionData.asReadonly();

  startTransition(type: TransitionType = 'admin'): void {
    this._transitionType.set(type);
    this._isTransitioning.set(true);
  }

  endTransition(): void {
    setTimeout(() => {
      this._isTransitioning.set(false);
      this._transitionType.set(null);
    }, 100);
  }

  setReportTransitionData(data: ReportTransitionData): void {
    this._reportTransitionData.set(data);
  }

  clearReportTransitionData(): void {
    this._reportTransitionData.set(null);
  }
}

