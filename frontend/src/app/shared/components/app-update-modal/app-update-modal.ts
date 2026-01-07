import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpdateService, UpdateInfo } from '../../services/update.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
    selector: 'app-update-modal',
    standalone: true,
    imports: [CommonModule, UiIconComponent],
    template: `
    @if (updateService.updateAvailable(); as updateInfo) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-base-100 w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-scale-up">
          
          <!-- Header con gradiente -->
          <div class="bg-gradient-to-br from-primary to-primary-focus p-6 text-white relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-10">
              <ui-icon name="Rocket" size="xl" />
            </div>
            
            <div class="relative z-10 flex items-start gap-4">
              <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
                <ui-icon name="Download" size="lg" class="text-white" />
              </div>
              <div>
                <h3 class="text-xl font-bold tracking-tight">Nueva Versión</h3>
                <p class="text-primary-content/80 text-sm font-medium">
                  v{{ updateInfo.version }} disponible
                </p>
              </div>
            </div>
          </div>

          <!-- Contenido -->
          <div class="p-6">
            <div class="mb-6">
              <h4 class="text-sm font-bold text-base-content/50 uppercase tracking-wider mb-3">Novedades</h4>
              <div class="bg-base-200/50 rounded-xl p-4 text-sm text-base-content/80 leading-relaxed whitespace-pre-line border border-base-200">
                {{ updateInfo.releaseNotes }}
              </div>
            </div>

            <!-- Barra de Progreso (si está descargando) -->
            @if (updateService.isDownloading()) {
              <div class="mb-2 space-y-2">
                <div class="flex justify-between text-xs font-bold text-base-content/70">
                  <span>Descargando...</span>
                  <span>{{ updateService.downloadProgress() }}%</span>
                </div>
                <progress 
                  class="progress progress-primary w-full h-3" 
                  [value]="updateService.downloadProgress()" 
                  max="100">
                </progress>
              </div>
            }

            <!-- Botones -->
            <div class="flex flex-col gap-3 mt-6">
              <button 
                (click)="onUpdate()"
                [disabled]="updateService.isDownloading()"
                class="btn btn-primary btn-lg w-full shadow-lg shadow-primary/30 border-none relative overflow-hidden">
                @if (updateService.isDownloading()) {
                  <span class="loading loading-spinner"></span>
                  Instalando...
                } @else {
                  <span class="flex items-center gap-2">
                    Actualizar Ahora
                    <ui-icon name="ArrowRight" size="sm" />
                  </span>
                }
              </button>

              @if (!updateInfo.forceUpdate && !updateService.isDownloading()) {
                <button 
                  (click)="onLater()"
                  class="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content hover:bg-base-200/50">
                  Quizás más tarde
                </button>
              }
            </div>
          </div>
          
        </div>
      </div>
    }
  `,
    styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    
    .animate-scale-up {
      animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { 
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to { 
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `]
})
export class AppUpdateModal {
    updateService = inject(UpdateService);

    onUpdate() {
        this.updateService.downloadAndInstall();
    }

    onLater() {
        // Ocultar modal limpiando el estado
        this.updateService.updateAvailable.set(null);
    }
}
