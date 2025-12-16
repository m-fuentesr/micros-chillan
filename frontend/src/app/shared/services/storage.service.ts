import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number; // Tamaño final optimizado
  original_size?: number; // Tamaño original (opcional, para mostrar ahorro)
  mime_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  /**
   * Sube una imagen a través del backend FastAPI
   * El backend valida, sanitiza y sube a Supabase Storage
   * 
   * @param file Archivo de imagen
   * @param choferId ID del chofer (para organización en Storage)
   * @param fecha Fecha del registro (YYYY-MM-DD)
   * @param onProgress Callback opcional para progreso
   * @returns Observable con la URL de la imagen subida
   */
  uploadDailyRecordImage(
    file: File,
    choferId: number,
    fecha: string,
    onProgress?: (progress: UploadProgress) => void
  ): Observable<UploadResult> {
    // Validación en capa 1 (Frontend)
    const validationError = this.validateImageFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    // Preparar FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chofer_id', choferId.toString());
    formData.append('fecha', fecha);

    // Subir a través del backend
    return this.http.post<UploadResult>(
      `${this.apiUrl}/api/storage/upload-daily-record-image`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map((event: HttpEvent<any>) => {
        // Manejar eventos de progreso
        if (event.type === HttpEventType.UploadProgress) {
          const progressEvent = event as HttpProgressEvent;
          const progress: UploadProgress = {
            loaded: progressEvent.loaded || 0,
            total: progressEvent.total || 0,
            percentage: progressEvent.total 
              ? Math.round((100 * progressEvent.loaded) / progressEvent.total)
              : 0
          };
          
          if (onProgress) {
            onProgress(progress);
          }
        }
        
        // Retornar resultado cuando esté completo
        if (event.type === HttpEventType.Response) {
          return event.body as UploadResult;
        }
        
        return null;
      }),
      // Filtrar solo el resultado final
      filter((result): result is UploadResult => result !== null),
      catchError((error) => {
        console.error('Error subiendo imagen:', error);
        return throwError(() => 
          new Error(error.error?.detail || error.message || 'Error al subir la imagen')
        );
      })
    );
  }

  /**
   * Sube una imagen como administrador (permite subir para cualquier chofer)
   * El backend valida que el usuario sea admin y guarda la imagen en la carpeta del chofer indicado
   * 
   * @param file Archivo de imagen
   * @param choferId ID del chofer para el cual se sube la imagen
   * @param fecha Fecha del registro (YYYY-MM-DD)
   * @param onProgress Callback opcional para progreso
   * @returns Observable con la URL de la imagen subida
   */
  uploadDailyRecordImageAdmin(
    file: File,
    choferId: number,
    fecha: string,
    onProgress?: (progress: UploadProgress) => void
  ): Observable<UploadResult> {
    // Validación en capa 1 (Frontend)
    const validationError = this.validateImageFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    // Preparar FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chofer_id', choferId.toString());
    formData.append('fecha', fecha);

    // Subir a través del backend (endpoint de admin)
    return this.http.post<UploadResult>(
      `${this.apiUrl}/api/storage/upload-daily-record-image-admin`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map((event: HttpEvent<any>) => {
        // Manejar eventos de progreso
        if (event.type === HttpEventType.UploadProgress) {
          const progressEvent = event as HttpProgressEvent;
          const progress: UploadProgress = {
            loaded: progressEvent.loaded || 0,
            total: progressEvent.total || 0,
            percentage: progressEvent.total 
              ? Math.round((100 * progressEvent.loaded) / progressEvent.total)
              : 0
          };
          
          if (onProgress) {
            onProgress(progress);
          }
        }
        
        // Retornar resultado cuando esté completo
        if (event.type === HttpEventType.Response) {
          return event.body as UploadResult;
        }
        
        return null;
      }),
      // Filtrar solo el resultado final
      filter((result): result is UploadResult => result !== null),
      catchError((error) => {
        console.error('Error subiendo imagen como admin:', error);
        return throwError(() => 
          new Error(error.error?.detail || error.message || 'Error al subir la imagen')
        );
      })
    );
  }

  /**
   * Valida el archivo de imagen en el frontend (Capa 1)
   */
  private validateImageFile(file: File): string | null {
    // Validar tipo MIME
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return 'Solo se permiten archivos de imagen (JPG, PNG, WebP, JFIF)';
    }

    // Validar extensión
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.jfif'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return 'Extensión de archivo no permitida';
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `El archivo es demasiado grande. Máximo permitido: ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
    }

    // Validar tamaño mínimo (evitar archivos corruptos)
    const minSize = 1024; // 1KB
    if (file.size < minSize) {
      return 'El archivo parece estar corrupto o vacío';
    }

    return null;
  }

  /**
   * Comprime una imagen usando Canvas API (para reducir tamaño antes de subir)
   * Ideal ejecutar en Web Worker para no bloquear UI
   */
  async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es necesario
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto del canvas'));
            return;
          }

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a Blob y luego a File
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir la imagen'));
                return;
              }

              const compressedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Genera una URL de preview local para mostrar antes de subir
   */
  createPreviewUrl(file: File): Observable<string> {
    return new Observable((observer) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      
      reader.onerror = (error) => {
        observer.error(error);
      };
      
      reader.readAsDataURL(file);
    });
  }
}

