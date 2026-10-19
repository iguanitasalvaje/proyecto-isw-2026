function ReportesPage() {
  const tarjetaStyle = {
    backgroundColor: '#161b22',
    border: '1px solid #263142',
    borderRadius: '10px',
    padding: '30px',
    minHeight: '112px',
  }

  const labelStyle = {
    margin: 0,
    color: '#4f6b8a',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '1px',
  }

  const reportes = [
    {
      titulo: 'Resumen Mensual · Agosto 2025',
      descripcion: 'Eventos, ingresos, costos y margen neto.',
      fecha: 'Ago 23',
      peso: '428 KB',
    },
    {
      titulo: 'Control de Inventario Q3',
      descripcion: 'Estado de todos los activos, movimientos y alertas.',
      fecha: 'Ago 20',
      peso: '318 KB',
    },
    {
      titulo: 'Informe de Auspiciadores',
      descripcion: 'Cobros realizados, pendientes y vencidos.',
      fecha: 'Ago 18',
      peso: '195 KB',
    },
  ]

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0d1117',
        color: '#ffffff',
        padding: '24px 30px',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
        textAlign: 'left',
      }}
    >
      {/* ENCABEZADO */}
      <div>
        <p
          style={{
            margin: '0 0 12px',
            color: '#4f6b8a',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '1.2px',
          }}
        >
          DOCUMENTOS Y ESTADÍSTICAS
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
          }}
        >
          Reportes
        </h1>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px',
          marginTop: '30px',
        }}
      >
        {/* Eventos realizados */}
        <div style={tarjetaStyle}>
          <p style={labelStyle}>EVENTOS REALIZADOS</p>

          <div
            style={{
              marginTop: '12px',
              fontSize: '54px',
              fontWeight: '700',
              color: '#dce3eb',
              lineHeight: 1,
            }}
          >
            1
          </div>

          <p
            style={{
              margin: '12px 0 0',
              color: '#7da2ce',
              fontSize: '16px',
            }}
          >
            Año 2025 hasta la fecha
          </p>
        </div>

        {/* Ingresos acumulados */}
        <div style={tarjetaStyle}>
          <p style={labelStyle}>INGRESOS ACUMULADOS</p>

          <div
            style={{
              marginTop: '12px',
              color: '#39e67d',
              fontSize: '48px',
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            $3.450.000
          </div>

          <p
            style={{
              margin: '14px 0 0',
              color: '#7da2ce',
              fontSize: '16px',
            }}
          >
            Enero – Agosto 2025
          </p>
        </div>

        {/* Margen promedio */}
        <div style={tarjetaStyle}>
          <p style={labelStyle}>MARGEN PROMEDIO</p>

          <div
            style={{
              marginTop: '12px',
              color: '#39e67d',
              fontSize: '54px',
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            63%
          </div>

          <p
            style={{
              margin: '12px 0 0',
              color: '#7da2ce',
              fontSize: '16px',
            }}
          >
            Por evento este trimestre
          </p>
        </div>

        {/* Activos registrados */}
        <div style={tarjetaStyle}>
          <p style={labelStyle}>ACTIVOS REGISTRADOS</p>

          <div
            style={{
              marginTop: '12px',
              color: '#3b82f6',
              fontSize: '54px',
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            13
          </div>

          <p
            style={{
              margin: '12px 0 0',
              color: '#7da2ce',
              fontSize: '16px',
            }}
          >
            En inventario activo
          </p>
        </div>
      </div>

      {/* REPORTES DISPONIBLES */}
      <section
        style={{
          marginTop: '24px',
          backgroundColor: '#161b22',
          border: '1px solid #263142',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera sección */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 22px',
            borderBottom: '1px solid #263142',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
              }}
            >
              Reportes Disponibles
            </h2>

            <p
              style={{
                margin: '8px 0 0',
                color: '#7da2ce',
                fontSize: '16px',
              }}
            >
              Descarga o visualiza los reportes generados
            </p>
          </div>

          <button
            type="button"
            style={{
              backgroundColor: '#2f6fe4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 18px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'default',
            }}
          >
            ＋ Nuevo reporte
          </button>
        </div>

        {/* LISTA */}
        {reportes.map((reporte, index) => (
          <div
            key={reporte.titulo}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 130px 140px',
              gap: '16px',
              alignItems: 'center',
              padding: '20px 22px',
              borderBottom:
                index === reportes.length - 1
                  ? 'none'
                  : '1px solid #263142',
            }}
          >
            {/* Icono documento */}
            <div
              style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1b2533',
                border: '1px solid #263142',
                borderRadius: '8px',
                color: '#7da2ce',
                fontSize: '21px',
              }}
            >
              ▤
            </div>

            {/* Información */}
            <div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                }}
              >
                {reporte.titulo}
              </div>

              <div
                style={{
                  marginTop: '7px',
                  color: '#7da2ce',
                  fontSize: '15px',
                }}
              >
                {reporte.descripcion}
              </div>
            </div>

            {/* Fecha y tamaño */}
            <div
              style={{
                textAlign: 'right',
                color: '#4f6b8a',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              <div>Generado {reporte.fecha}</div>
              <div>{reporte.peso}</div>
            </div>

            {/* Descargar */}
            <button
              type="button"
              style={{
                backgroundColor: 'transparent',
                color: '#7da2ce',
                border: '1px solid #263142',
                borderRadius: '8px',
                padding: '11px 15px',
                fontSize: '15px',
                cursor: 'default',
              }}
            >
              ⇩ &nbsp; Descargar
            </button>
          </div>
        ))}
      </section>
    </main>
  )
}

export default ReportesPage