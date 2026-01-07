import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { environment } from '../../../environments/environment';

export interface UpdateInfo {
    version: string;
    build: number;
    forceUpdate: boolean;
    releaseNotes: string;
    // Nota: No incluimos url aquí porque la URL de descarga es fija por arquitectura (/api/mobile/apk)
}

@Injectable({
    providedIn: 'root'
})
export class UpdateService {
    private http = inject(HttpClient);

    // Señales de estado para la UI
    isChecking = signal(false);
    isDownloading = signal(false);
    downloadProgress = signal(0);
    updateAvailable = signal<UpdateInfo | null>(null);

    constructor() {
        this.checkForUpdate();
    }

    /**
     * 1. Verificación de Versión
     * Consulta /api/updates/check y compara builds.
     */
    async checkForUpdate() {
        // Solo ejecutar en dispositivo nativo
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        this.isChecking.set(true);

        try {
            // Obtener info actual del dispositivo
            const appInfo = await App.getInfo();
            const currentBuild = parseInt(appInfo.build);

            console.log(`[UpdateService] Current Build: ${currentBuild}`);

            console.log(`[UpdateService] Checking URL: ${environment.apiBaseUrl}/api/updates/check`);

            // Consultar endpoint de chequeo
            this.http.get<UpdateInfo>(`${environment.apiBaseUrl}/api/updates/check`)
                .subscribe({
                    next: (info) => {
                        // Comparar: Si remoto > local, hay update
                        if (info.build > currentBuild) {
                            console.log('[UpdateService] Update available!');
                            this.updateAvailable.set(info);
                        }
                        this.isChecking.set(false);
                    },
                    error: (err) => {
                        console.error('[UpdateService] Check error checking updates:', err);
                        this.isChecking.set(false);
                    }
                });

        } catch (e) {
            console.error('[UpdateService] Native info error:', e);
            this.isChecking.set(false);
        }
    }

    /**
     * 2. Descarga del APK
     * Usa URL fija: environment.apiBaseUrl + '/api/mobile/apk'
     */
    async downloadAndInstall() {
        // Verificar si hay update pendiente
        const info = this.updateAvailable();
        if (!info) return;

        this.isDownloading.set(true);
        this.downloadProgress.set(0);

        // URL Fija de descarga (Proxy del Backend)
        // Se asume que /api/mobile/apk redirige a la URL firmada
        const downloadUrl = `${environment.apiBaseUrl}/api/mobile/apk`;
        const fileName = 'update.apk';

        console.log(`[UpdateService] Downloading from: ${downloadUrl}`);

        this.http.get(downloadUrl, {
            responseType: 'blob',
            reportProgress: true,
            observe: 'events'
        }).subscribe({
            next: async (event: any) => {
                // Reportar progreso
                if (event.type === 3) { // DownloadProgress
                    const percent = Math.round(100 * event.loaded / (event.total || 1));
                    this.downloadProgress.set(percent);
                }
                // Descarga completada
                if (event.type === 4) { // Response
                    const blob = event.body;
                    await this.processDownloadedApk(blob, fileName);
                    this.isDownloading.set(false);
                }
            },
            error: (err) => {
                console.error('[UpdateService] Download error:', err);
                this.isDownloading.set(false);
            }
        });
    }

    /**
     * 3. Instalación
     * Guarda Blob -> FileSystem y abre Intent nativo
     */
    private async processDownloadedApk(blob: Blob, fileName: string) {
        try {
            // Convertir Blob a Base64 para Capacitor Filesystem
            const base64 = await this.blobToBase64(blob);

            // Guardar archivo en Cache
            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Cache,
                recursive: true
            });

            console.log('[UpdateService] File saved:', savedFile.uri);

            // 4. Invocar instalador nativo
            await FileOpener.open({
                filePath: savedFile.uri,
                contentType: 'application/vnd.android.package-archive'
            });

        } catch (err) {
            console.error('[UpdateService] Install error:', err);
        }
    }

    // Utilidad: Blob a Base64
    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remover prefijo data:application/vnd...;base64,
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
