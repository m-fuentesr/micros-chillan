import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TransitionService {
  private _isTransitioning = signal(false);
  readonly isTransitioning = this._isTransitioning.asReadonly();

  startTransition(): void {
    this._isTransitioning.set(true);
  }

  endTransition(): void {
    setTimeout(() => {
      this._isTransitioning.set(false);
    }, 100);
  }
}

