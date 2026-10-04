import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { WorkerService } from './worker.service';
import { DailyRecordService } from './daily-record.service';
import type { WorkerProfile } from '../models/worker.models';

function profile(nombre: string, maquina: number): WorkerProfile {
  return {
    nombre_completo: nombre,
    rut: '',
    telefono: '',
    email: '',
    maquina_detalle: `${maquina} - Marca`,
    maquina_id: maquina,
    maquina_numero: maquina,
    fecha_ingreso: '01-01-2026',
  };
}

describe('AuthService - logout limpia los datos del trabajador', () => {
  let auth: AuthService;
  let workerService: WorkerService;
  let httpMock: HttpTestingController;

  const isProfileRequest = (req: { url: string }) => req.url.endsWith('/api/worker/profile');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    auth = TestBed.inject(AuthService);
    workerService = TestBed.inject(WorkerService);
    httpMock = TestBed.inject(HttpTestingController);

    // No contactar Supabase real al cerrar sesión
    spyOn(auth.supabase.auth, 'signOut').and.resolveTo({ error: null });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('el siguiente usuario no hereda el perfil (máquina) del anterior', async () => {
    // Chofer A carga su perfil (queda en caché)
    workerService.getProfile().subscribe();
    httpMock.expectOne(isProfileRequest).flush(profile('Chofer A', 26));

    // Mientras la sesión sigue, el perfil sale de caché (sin nueva petición)
    workerService.getProfile().subscribe();
    httpMock.expectNone(isProfileRequest);

    await auth.logout({ redirect: false, showSpinner: false });

    // Chofer B: el perfil debe pedirse de nuevo al backend, no salir de la caché de A
    let perfilB: WorkerProfile | undefined;
    workerService.getProfile().subscribe((p) => (perfilB = p));
    httpMock.expectOne(isProfileRequest).flush(profile('Chofer B', 18));

    expect(perfilB?.nombre_completo).toBe('Chofer B');
    expect(perfilB?.maquina_id).toBe(18);
  });

  it('limpia también el historial guardado', async () => {
    const dailyRecordService = TestBed.inject(DailyRecordService);
    const historySpy = spyOn(dailyRecordService, 'invalidateHistoryCache').and.callThrough();

    await auth.logout({ redirect: false, showSpinner: false });

    expect(historySpy).toHaveBeenCalled();
  });
});
