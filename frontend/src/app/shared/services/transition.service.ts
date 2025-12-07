import { Injectable, signal } from '@angular/core';

export type TransitionType = 'admin' | 'worker';
export type EntryType = 'initial' | 'redirect' | 'tab-restore' | 'navigation';

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
  private _entryType = signal<EntryType | null>(null);
  private _reportTransitionData = signal<ReportTransitionData | null>(null);
  
  readonly isTransitioning = this._isTransitioning.asReadonly();
  readonly transitionType = this._transitionType.asReadonly();
  readonly entryType = this._entryType.asReadonly();
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

  setEntryType(type: EntryType): void {
    this._entryType.set(type);
  }

  detectEntryType(
    previousUrl: string | null,
    currentUrl: string,
    hasUser: boolean,
    hasRedirectParam: boolean,
    isPreviousAdminRoute: boolean = false,
    isCurrentAdminRoute: boolean = false
  ): EntryType {
    // Si no hay previousUrl y hay usuario → tab-restore
    if (!previousUrl && hasUser) {
      return 'tab-restore';
    }
    
    // Si viene de login → initial
    if (previousUrl?.startsWith('/login')) {
      return 'initial';
    }
    
    // Si hay redirectTo en queryParams → redirect
    if (hasRedirectParam) {
      return 'redirect';
    }
    
    // Si vienes de una ruta NO admin a una ruta admin → initial (entrada al dashboard)
    if (previousUrl && !isPreviousAdminRoute && isCurrentAdminRoute) {
      return 'initial';
    }
    
    // Si vienes de una ruta admin a otra ruta admin → navigation (cambio de página)
    if (isPreviousAdminRoute && isCurrentAdminRoute) {
      return 'navigation';
    }
    
    // Default → navigation
    return 'navigation';
  }

  setReportTransitionData(data: ReportTransitionData): void {
    this._reportTransitionData.set(data);
  }

  clearReportTransitionData(): void {
    this._reportTransitionData.set(null);
  }
}

