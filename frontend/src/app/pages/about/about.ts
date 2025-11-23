import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [],
  template: `
    <div class="card w-full bg-base-100 shadow-xl border border-gray-200">
      <div class="card-body">
        <h2 class="card-title text-3xl">Acerca de Nosotros</h2>
        <p>Esta aplicación de ejemplo usa las siguientes tecnologías:</p>
        <ul class="list-disc list-inside mt-4 space-y-2">
          <li><span class="badge badge-lg badge-info">Angular CLI</span> para la estructura del proyecto.</li>
          <li><span class="badge badge-lg badge-success">Tailwind CSS</span> para utilidades de estilo.</li>
          <li><span class="badge badge-lg badge-warning">DaisyUI</span> para componentes pre-diseñados.</li>
        </ul>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class About {

}
