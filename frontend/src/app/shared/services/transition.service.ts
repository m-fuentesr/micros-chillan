import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TransitionService {
  private _isTransitioning = signal(false);
  readonly isTransitioning = this._isTransitioning.asReadonly();

  startTransition(): void {
    console.log('[TRANSITION SERVICE] 🎬 START TRANSITION - Activando overlay blanco');
    this._isTransitioning.set(true);
    console.log('[TRANSITION SERVICE] ✅ Estado isTransitioning:', this._isTransitioning());
  }

  endTransition(): void {
    console.log('[TRANSITION SERVICE] 🎭 END TRANSITION - Ocultando overlay en 100ms');
    setTimeout(() => {
      this._isTransitioning.set(false);
      console.log('[TRANSITION SERVICE] ✅ Estado isTransitioning:', this._isTransitioning());
    }, 100);
  }
}

