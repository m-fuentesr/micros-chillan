import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Reportar } from './reportar';
import { MachineService } from '../../../shared/services/machine.service';
import { WorkerService } from '../../../shared/services/worker.service';
import { DailyRecordService } from '../../../shared/services/daily-record.service';
import { TodayRecordStatusService } from '../../../shared/services/today-record-status.service';
import { AuthService } from '../../../shared/services/auth.service';
import { StorageService } from '../../../shared/services/storage.service';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import type { MachineSelect } from '../../../shared/models/machine.models';
import type { WorkerProfile } from '../../../shared/models/worker.models';

// Máquinas operativas reales al momento del bug: la 18 es la primera de la lista
const MACHINES: MachineSelect[] = [18, 19, 26, 28, 29].map((numero, i) => ({
  id: 100 + i,
  numero_interno: String(numero),
  marca: 'Marca',
  modelo: 'Modelo',
  anio: 2020,
  patente: `AAAA-${numero}`,
  display_name: `${numero} - Marca`,
}));
const MACHINE_18 = MACHINES[0];
const MACHINE_26 = MACHINES[2];

function profile(overrides: Partial<WorkerProfile> = {}): WorkerProfile {
  return {
    nombre_completo: 'Chofer Prueba',
    rut: '11111111-1',
    telefono: '',
    email: 'prueba@test.cl',
    maquina_detalle: '26 - Marca',
    maquina_id: MACHINE_26.id,
    maquina_numero: 26,
    fecha_ingreso: '01-01-2026',
    ...overrides,
  };
}

describe('Reportar - preselección de máquina', () => {
  let fixture: ComponentFixture<Reportar>;
  let component: Reportar;
  let machines$: Subject<MachineSelect[]>;
  let profile$: Subject<WorkerProfile>;
  let dailyRecordService: jasmine.SpyObj<DailyRecordService>;
  let confirmModal: ConfirmModalService;

  beforeEach(async () => {
    machines$ = new Subject();
    profile$ = new Subject();
    dailyRecordService = jasmine.createSpyObj('DailyRecordService', [
      'createDailyRecord',
      'invalidateHistoryCache',
    ]);

    await TestBed.configureTestingModule({
      imports: [Reportar],
      providers: [
        provideRouter([]),
        { provide: MachineService, useValue: { getActiveMachines: () => machines$ } },
        {
          provide: WorkerService,
          useValue: { getProfile: () => profile$, invalidateCache: () => {} },
        },
        { provide: DailyRecordService, useValue: dailyRecordService },
        {
          provide: TodayRecordStatusService,
          useValue: {
            status: signal({ exists: false, can_create_new: true }),
            refreshStatus: () => {},
          },
        },
        { provide: AuthService, useValue: { currentUser: signal(null) } },
        {
          provide: StorageService,
          useValue: jasmine.createSpyObj('StorageService', [
            'compressImage',
            'uploadDailyRecordImage',
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Reportar);
    component = fixture.componentInstance;
    confirmModal = TestBed.inject(ConfirmModalService);
    fixture.detectChanges();
  });

  function machineValue() {
    return component.reportForm.get('machine')?.value;
  }

  it('no preselecciona la 18 si el perfil llega después que la lista (bug original)', () => {
    machines$.next(MACHINES);
    fixture.detectChanges();
    expect(machineValue()).toBeNull();

    profile$.next(profile());
    fixture.detectChanges();
    expect(machineValue()).toBe(MACHINE_26.id);
  });

  it('preselecciona la máquina asignada si el perfil llega antes que la lista', () => {
    profile$.next(profile());
    machines$.next(MACHINES);
    fixture.detectChanges();
    expect(machineValue()).toBe(MACHINE_26.id);
  });

  it('usa el número del texto si el backend aún no envía maquina_id', () => {
    machines$.next(MACHINES);
    profile$.next(profile({ maquina_id: undefined, maquina_numero: undefined }));
    fixture.detectChanges();
    expect(machineValue()).toBe(MACHINE_26.id);
  });

  it('deja el selector vacío si el chofer no tiene máquina asignada', () => {
    machines$.next(MACHINES);
    profile$.next(profile({ maquina_detalle: 'Sin Asignar', maquina_id: null, maquina_numero: null }));
    fixture.detectChanges();
    expect(machineValue()).toBeNull();
  });

  it('pide confirmación y no envía si la máquina elegida no es la asignada', async () => {
    machines$.next(MACHINES);
    profile$.next(profile());
    fixture.detectChanges();

    component.reportForm.patchValue({ machine: MACHINE_18.id, amount: 10000 });
    component.evidenceFile.set(new File(['x'], 'comprobante.jpg', { type: 'image/jpeg' }));
    const openSpy = spyOn(confirmModal, 'open').and.resolveTo(false);

    await component.enviarReporte();

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.calls.mostRecent().args[0].message).toContain('26');
    expect(openSpy.calls.mostRecent().args[0].message).toContain('18');
    expect(dailyRecordService.createDailyRecord).not.toHaveBeenCalled();
  });

  it('no pide confirmación si la máquina elegida es la asignada', async () => {
    machines$.next(MACHINES);
    profile$.next(profile());
    fixture.detectChanges();

    component.reportForm.patchValue({ amount: 10000 });
    component.evidenceFile.set(new File(['x'], 'comprobante.jpg', { type: 'image/jpeg' }));
    const openSpy = spyOn(confirmModal, 'open');

    // Sin usuario logueado el envío se corta antes de subir nada (se loguea un error esperado);
    // solo interesa que no se haya abierto el modal de confirmación
    await component.enviarReporte().catch(() => {});

    expect(openSpy).not.toHaveBeenCalled();
  });
});
