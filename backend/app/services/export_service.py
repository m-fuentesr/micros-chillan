from io import BytesIO
from datetime import datetime
import pandas as pd
from xhtml2pdf import pisa
from jinja2 import Template

# ==============================================================================
# PLANTILLA HTML PARA LA NÓMINA (Actualizada con columna Ref)
# ==============================================================================
HTML_NOMINA = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Helvetica, sans-serif; color: #333; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .title { font-size: 20px; font-weight: bold; color: #444; }
        .meta { font-size: 12px; color: #777; margin-top: 5px; }
        
        .kpi-container { margin-bottom: 20px; }
        .kpi-box { display: inline-block; width: 23%; vertical-align: top; }
        .kpi-label { font-size: 10px; color: #888; text-transform: uppercase; }
        .kpi-value { font-size: 16px; font-weight: bold; color: #222; }
        
        .week-section { margin-bottom: 25px; page-break-inside: avoid; }
        .week-header { background-color: #f4f6f8; padding: 8px; border-radius: 4px; margin-bottom: 10px; }
        .week-title { font-weight: bold; font-size: 14px; }
        .week-date { font-size: 11px; color: #666; margin-left: 10px; }
        .week-total { float: right; font-weight: bold; font-size: 14px; }

        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: left; border-bottom: 1px solid #ddd; padding: 5px; color: #666; font-weight: normal; }
        td { border-bottom: 1px solid #eee; padding: 6px 5px; color: #333; }
        
        /* Estilos específicos para columnas */
        .col-money { text-align: right; white-space: nowrap; }
        .col-ref { font-size: 10px; color: #666; font-style: italic; max-width: 100px; overflow: hidden; }
        .badge { background: #eee; padding: 2px 5px; border-radius: 3px; font-size: 9px; text-transform: uppercase; }
        
        .footer { position: fixed; bottom: 20px; font-size: 9px; color: #aaa; width: 100%; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Comprobante de Nómina</div>
        <div class="meta">Período: {{ periodo }} | Estado: {{ estado }}</div>
    </div>

    <div class="kpi-container">
        <div class="kpi-box">
            <div class="kpi-label">Total Liquidado</div>
            <div class="kpi-value">${{ total_general }}</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-label">Choferes</div>
            <div class="kpi-value">{{ total_choferes }}</div>
        </div>
        <div class="kpi-box">
            <div class="kpi-label">Fecha Cierre</div>
            <div class="kpi-value">{{ fecha_cierre }}</div>
        </div>
    </div>

    {% for semana in semanas %}
    <div class="week-section">
        <div class="week-header">
            <span class="week-title">{{ semana.nombre }}</span>
            <span class="week-date">{{ semana.rango }}</span>
            <span class="week-total">Total: ${{ semana.total }}</span>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="25%">Beneficiario</th>
                    <th width="15%" class="col-money">Base</th>
                    <th width="15%" class="col-money">Ajuste</th>
                    <th width="15%" class="col-money">Total</th>
                    <th width="15%">Método</th>
                    <th width="15%">Ref</th> </tr>
            </thead>
            <tbody>
                {% for pago in semana.pagos %}
                <tr>
                    <td>{{ pago.nombre }}</td>
                    <td class="col-money">{{ pago.base }}</td>
                    <td class="col-money">{{ pago.ajuste }}</td>
                    <td class="col-money"><strong>{{ pago.total }}</strong></td>
                    <td><span class="badge">{{ pago.metodo }}</span></td>
                    <td class="col-ref">{{ pago.ref }}</td> </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    {% endfor %}

    <div class="footer">
        Generado el: {{ hoy }}
    </div>
</body>
</html>
"""

# ==============================================================================
# PLANTILLA HTML GENÉRICA (Para los otros reportes simples)
# ==============================================================================
HTML_GENERICO = """
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: Helvetica, sans-serif; padding: 20px; }
    h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th { background-color: #f8f9fa; border: 1px solid #ddd; padding: 8px; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
</style>
</head>
<body>
    <h2>{{ titulo }}</h2>
    <div class="meta">Generado el: {{ fecha }} por {{ usuario }}</div>
    
    <table>
        <thead>
            <tr>
                {% for key, label in columnas.items() %}
                <th>{{ label }}</th>
                {% endfor %}
            </tr>
        </thead>
        <tbody>
            {% for fila in datos %}
            <tr>
                {% for key in columnas.keys() %}
                <td>{{ fila[key] }}</td>
                {% endfor %}
            </tr>
            {% endfor %}
        </tbody>
    </table>
</body>
</html>
"""

# ==============================================================================
# CLASE EXPORT SERVICE
# ==============================================================================
class ExportService:
    
    @staticmethod
    def to_pdf(titulo: str, columnas: dict, datos: list, usuario: str = "Sistema") -> BytesIO:
        """
        Genera PDF genérico para tablas (Ej: Reporte de Rentabilidad).
        """
        template = Template(HTML_GENERICO)
        html = template.render(
            titulo=titulo,
            columnas=columnas,
            datos=datos,
            usuario=usuario,
            fecha=datetime.now().strftime("%d/%m/%Y %H:%M")
        )
        
        buffer = BytesIO()
        pisa_status = pisa.CreatePDF(html, dest=buffer)
        if pisa_status.err:
            raise Exception("Error creando PDF genérico")
        buffer.seek(0)
        return buffer

    @staticmethod
    def to_excel(columnas: dict, datos: list) -> BytesIO:
        """
        Genera Excel genérico (.xlsx) para cualquier tabla.
        """
        df = pd.DataFrame(datos)
        
        # Asegurar que existan todas las columnas
        keys_a_usar = list(columnas.keys())
        for k in keys_a_usar:
            if k not in df.columns:
                df[k] = ""
                
        # Filtrar y renombrar
        df = df[keys_a_usar]
        df.rename(columns=columnas, inplace=True)
        
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Reporte')
            
            # Ajuste automático de ancho de columnas
            worksheet = writer.sheets['Reporte']
            for idx, col in enumerate(df.columns):
                # Calculamos el ancho máximo basado en el contenido o el encabezado
                max_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)

        buffer.seek(0)
        return buffer

    @staticmethod
    def generar_comprobante_nomina(datos_nomina: dict) -> BytesIO:
        """
        Genera el PDF específico para liquidaciones (Nómina).
        """
        # Aquí usamos la HTML_NOMINA que acabamos de definir arriba con la columna Ref
        template = Template(HTML_NOMINA)
        
        # Inyectamos fecha actual automática
        datos_nomina["hoy"] = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        html = template.render(**datos_nomina)
        
        buffer = BytesIO()
        pisa_status = pisa.CreatePDF(html, dest=buffer)
        if pisa_status.err:
            raise Exception("Error creando PDF de Nómina")
        buffer.seek(0)
        return buffer