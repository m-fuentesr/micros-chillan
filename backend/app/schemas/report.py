from pydantic import BaseModel

class MachineProfitabilityResponse(BaseModel):
    maquina_id: int
    identificador: str # Ej: "JCB-01" o el Nombre
    numero_interno: str | None = None
    patente: str | None = None
    
    # Ingresos
    ingresos_totales: int  # Suma de monto_recaudado
    
    # Egresos
    costos_diesel: int     # Suma de costo_total_diesel
    pago_choferes: int     # Suma de monto_porcentaje_chofer
    gastos_mantenimiento: int # Suma de compras_repuestos (Nuevo)
    
    # Resultado
    ganancia_neta: int     # La resta final

class MachineGrossRankingResponse(BaseModel):
    ranking: int          # Posición (1, 2, 3...)
    maquina_id: int
    identificador: str
    numero_interno: str | None = None
    patente: str | None = None
    
    ingresos_totales: int # El campo estrella de este reporte
    costos_diesel: int
    pago_choferes: int
    ganancia_neta: int    # Se calcula igual, pero no define el orden

class DriverProfitabilityResponse(BaseModel):
    ranking: int          # 1, 2, 3...
    chofer_id: int
    nombre_chofer: str
    
    dias_trabajados: int
    
    # Finanzas
    ingresos_totales: int
    costos_diesel: int
    pago_chofer: int      # Lo que él ganó
    
    # Resultado
    ganancia_neta: int    # Lo que le dejó a la empresa
