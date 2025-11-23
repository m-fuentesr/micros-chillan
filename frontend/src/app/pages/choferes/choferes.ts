import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-choferes',
  imports: [],
  template: `
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-3xl">Choferes</h2>
        <p>Gestión de choferes de la flota.</p>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Choferes {

}
