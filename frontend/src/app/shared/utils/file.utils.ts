import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';

/**
 * Descarga un Blob como archivo.
 * En Web: usa un elemento <a> invisible.
 * En Móvil (Capacitor): Guarda en Cache y abre el archivo directamente.
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
        try {
            const base64Data = await blobToBase64(blob);

            // Guardar en el directorio Cache
            const savedFile = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Cache
            });

            // Intentar abrir el archivo directamente
            try {
                // Obtener el tipo MIME del blob
                const mimeType = blob.type;

                await FileOpener.open({
                    filePath: savedFile.uri,
                    contentType: mimeType || 'application/pdf' // Fallback común si no hay mime
                });
            } catch (openError) {
                console.warn('Error al abrir archivo directamente, intentando compartir:', openError);

                // Fallback: Si falla abrir (ej. no hay app), usar Share
                await Share.share({
                    title: filename,
                    url: savedFile.uri,
                    dialogTitle: 'Descargar archivo'
                });
            }
        } catch (error) {
            console.error('Error en descarga nativa:', error);
            throw error;
        }
    } else {
        // Implementación Web clásica
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link); // Requerido en Firefox
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

/**
 * Convierte un Blob a string Base64 (sin el prefijo data:mime/type)
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // El resultado es "data:[<mediatype>][;base64],<data>"
            // Queremos solo la parte <data>
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}
