import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { environment } from '../../../environments/environment';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { Capacitor } from '@capacitor/core';

export interface UpdateInfo {
    version: string;
    build: number;
    downloadUrl: string; // Endpoint relativo del backend (ej: /mobile/apk)
    forceUpdate: boolean;
    releaseNotes: string;
}

@Injectable({
    providedIn: 'root'
})
export class UpdateService {
    private http = inject(HttpClient);

    // Estado
    isChecking = signal(false);
    isDownloading = signal(false);
    downloadProgress = signal(0);
    updateAvailable = signal<UpdateInfo | null>(null);

    constructor() {
        this.checkForUpdate();
    }

    /**
     * Verifica si hay actualizaciones disponibles
     */
    async checkForUpdate() {
        if (!Capacitor.isNativePlatform()) return;

        this.isChecking.set(true);

        try {
            const appInfo = await App.getInfo();
            const currentVersion = appInfo.version;
            const currentBuild = parseInt(appInfo.build);

            this.http.get<UpdateInfo>(`${environment.apiBaseUrl}/updates/check`)
                .subscribe({
                    next: (info) => {
                        console.log('Update info:', info);
                        console.log('Current version:', currentVersion, 'Current build:', currentBuild);

                        // Comparación simple de build number
                        if (info.build > currentBuild) {
                            this.updateAvailable.set(info);
                        }
                        this.isChecking.set(false);
                    },
                    error: (err) => {
                        console.error('Error checking for updates', err);
                        this.isChecking.set(false);
                    }
                });
        } catch (e) {
            console.error('Error getting app info', e);
            this.isChecking.set(false);
        }
    }

    /**
     * Descarga e instala la actualización
     */
    async downloadAndInstall() {
        const info = this.updateAvailable();
        if (!info || !info.downloadUrl) return;

        this.isDownloading.set(true);
        this.downloadProgress.set(0);

        try {
            const fileName = 'update.apk';

            // Construir URL completa usando apiBaseUrl y el endpoint relativo
            // Si downloadUrl ya es absoluta, la usa tal cual, sino la concatena
            const url = info.downloadUrl.startsWith('http')
                ? info.downloadUrl
                : `${environment.apiBaseUrl}${info.downloadUrl.startsWith('/') ? '' : '/'}${info.downloadUrl}`;

            this.http.get(url, {
                responseType: 'blob',
                reportProgress: true,
                observe: 'events'
            }).subscribe({
                next: async (event: any) => {
                    if (event.type === 3) { // DownloadProgress
                        const percent = Math.round(100 * event.loaded / (event.total || 1));
                        this.downloadProgress.set(percent);
                    }
                    if (event.type === 4) { // Response
                        const blob = event.body;
                        await this.saveAndOpenApk(blob, fileName);
                        this.isDownloading.set(false);
                    }
                },
                error: (err) => {
                    console.error('Download error', err);
                    this.isDownloading.set(false);
                }
            });

        } catch (e) {
            console.error('Error in download flow', e);
            this.isDownloading.set(false);
        }
    }

    private async saveAndOpenApk(blob: Blob, fileName: string) {
        try {
            const base64 = await this.blobToBase64(blob);

            // Guardar en cache o documentos externo
            const path = fileName;
            const directory = Directory.Cache;

            const result = await Filesystem.writeFile({
                path,
                data: base64,
                directory,
                recursive: true
            });

            console.log('File saved at', result.uri);

            // Abrir el APK
            await FileOpener.open({
                filePath: result.uri,
                contentType: 'application/vnd.android.package-archive'
            });

        } catch (err) {
            console.error('Error saving or opening APK', err);
        }
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
