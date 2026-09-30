function AuspiciadoresPage() {
  const columnas =
    '1.15fr 1.55fr 1.35fr 0.9fr 0.9fr 0.9fr 0.9fr 1fr'

  const filaStyle = {
    display: 'grid',
    gridTemplateColumns: columnas,
    padding: '16px 15px',
    alignItems: 'center',
    borderBottom: '1px solid #263142',
    fontSize: '14px',
  }

  const textoSecundario = {
    color: '#7da2ce',
    marginTop: '4px',
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0d1117',
        color: '#ffffff',
        padding: '28px 30px',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
        textAlign: 'left',
      }}
    >
      {/* ENCABEZADO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '700',
            }}
          >
            Auspiciadores
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: '#7da2ce',
              fontSize: '16px',
            }}
          >
            5 acuerdos registrados
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
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'default',
          }}
        >
          + Nuevo Auspiciador
        </button>
      </div>

      {/* TARJETAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginTop: '28px',
        }}
      >
        <div
          style={{
            backgroundColor: '#161b22',
            border: '1px solid #263142',
            borderRadius: '10px',
            padding: '22px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#4f6b8a',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '1px',
            }}
          >
            TOTAL ACORDADO
          </p>

          <h2
            style={{
              margin: '12px 0 0',
              fontSize: '30px',
              fontFamily: 'monospace',
            }}
          >
            $2.250.000
          </h2>
        </div>

        <div
          style={{
            backgroundColor: '#161b22',
            border: '1px solid #263142',
            borderRadius: '10px',
            padding: '22px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#4f6b8a',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '1px',
            }}
          >
            COBRADO
          </p>

          <h2
            style={{
              margin: '12px 0 0',
              color: '#39e67d',
              fontSize: '30px',
              fontFamily: 'monospace',
            }}
          >
            $1.100.000
          </h2>
        </div>

        <div
          style={{
            backgroundColor: '#161b22',
            border: '1px solid #263142',
            borderRadius: '10px',
            padding: '22px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#4f6b8a',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '1px',
            }}
          >
            PENDIENTE POR COBRAR
          </p>

          <h2
            style={{
              margin: '12px 0 0',
              color: '#ffb000',
              fontSize: '30px',
              fontFamily: 'monospace',
            }}
          >
            $1.150.000
          </h2>
        </div>
      </div>

      {/* FILTROS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '24px',
        }}
      >
        <button
          type="button"
          style={{
            backgroundColor: '#0d1117',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '15px',
          }}
        >
          Todos
        </button>

        <button
          type="button"
          style={{
            backgroundColor: '#0d1117',
            color: '#7da2ce',
            border: '1px solid #263142',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '15px',
          }}
        >
          Pendientes <span style={{ color: '#60758f' }}>(2)</span>
        </button>

        <button
          type="button"
          style={{
            backgroundColor: '#0d1117',
            color: '#7da2ce',
            border: '1px solid #263142',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '15px',
          }}
        >
          Parciales <span style={{ color: '#60758f' }}>(1)</span>
        </button>

        <button
          type="button"
          style={{
            backgroundColor: '#0d1117',
            color: '#7da2ce',
            border: '1px solid #263142',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '15px',
          }}
        >
          Pagados <span style={{ color: '#60758f' }}>(2)</span>
        </button>
      </div>

      {/* TABLA */}
      <div
        style={{
          marginTop: '18px',
          border: '1px solid #263142',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#161b22',
        }}
      >
        {/* ENCABEZADOS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: columnas,
            padding: '13px 15px',
            borderBottom: '1px solid #263142',
            color: '#4f6b8a',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '1px',
          }}
        >
          <span>EMPRESA</span>
          <span>CONTACTO</span>
          <span>EVENTO</span>
          <span>ESTADO</span>
          <span>ACORDADO</span>
          <span>PAGADO</span>
          <span>DIFERENCIA</span>
          <span>NOTAS</span>
        </div>

        {/* BANCO BCI */}
        <div style={filaStyle}>
          <div style={{ fontWeight: '700' }}>Banco BCI</div>

          <div>
            <div style={{ fontWeight: '600' }}>Andrés Fuentes</div>
            <div style={textoSecundario}>afuentes@bci.cl</div>
            <div style={textoSecundario}>+56 9 1111 2222</div>
          </div>

          <div>
            <div style={{ fontWeight: '600', lineHeight: '1.4' }}>
              Liga Regional de
              <br />
              Fútbol - Jornada 12
            </div>
            <div style={textoSecundario}>09-ago</div>
          </div>

          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#123d28',
                color: '#39e67d',
                border: '1px solid #1d5c3c',
                borderRadius: '5px',
                padding: '5px 9px',
                fontWeight: '600',
              }}
            >
              Pagado
            </span>
          </div>

          <div style={{ fontFamily: 'monospace' }}>$500.000</div>

          <div
            style={{
              color: '#39e67d',
              fontFamily: 'monospace',
            }}
          >
            $500.000
          </div>

          <div
            style={{
              color: '#39e67d',
              fontSize: '20px',
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            ✓
          </div>

          <div style={{ color: '#7da2ce', lineHeight: '1.5' }}>
            Pagado en cuota única antes del evento.
          </div>
        </div>

        {/* GATORADE */}
        <div style={filaStyle}>
          <div style={{ fontWeight: '700' }}>Gatorade Chile</div>

          <div>
            <div style={{ fontWeight: '600' }}>Sandra Muñoz</div>
            <div style={textoSecundario}>somunoz@gatorade.com</div>
            <div style={textoSecundario}>+56 9 2222 3333</div>
          </div>

          <div>
            <div style={{ fontWeight: '600', lineHeight: '1.4' }}>
              Liga Regional de
              <br />
              Fútbol - Jornada 12
            </div>
            <div style={textoSecundario}>09-ago</div>
          </div>

          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#4a3505',
                color: '#ffb000',
                border: '1px solid #6b4c08',
                borderRadius: '5px',
                padding: '5px 9px',
                fontWeight: '600',
              }}
            >
              Parcial
            </span>
          </div>

          <div style={{ fontFamily: 'monospace' }}>$300.000</div>

          <div
            style={{
              color: '#39e67d',
              fontFamily: 'monospace',
            }}
          >
            $150.000
          </div>

          <div
            style={{
              color: '#ffb000',
              fontFamily: 'monospace',
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            $150.000
          </div>

          <div style={{ color: '#7da2ce', lineHeight: '1.5' }}>
            Segunda cuota pendiente. Acordado para el 30 de agosto.
          </div>
        </div>

        {/* UNIVERSIDAD DEL PACÍFICO */}
        <div style={filaStyle}>
          <div
            style={{
              fontWeight: '700',
              lineHeight: '1.4',
            }}
          >
            Universidad
            <br />
            del Pacífico
          </div>

          <div>
            <div style={{ fontWeight: '600' }}>
              Rector Marcelo Reyes
            </div>
            <div style={textoSecundario}>mrreyes@upacifico.cl</div>
            <div style={textoSecundario}>+56 2 6789 0000</div>
          </div>

          <div>
            <div style={{ fontWeight: '600', lineHeight: '1.4' }}>
              Graduación
              <br />
              Ingeniería 2025
            </div>
            <div style={textoSecundario}>16-ago</div>
          </div>

          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#451c1c',
                color: '#ff5c5c',
                border: '1px solid #6a2929',
                borderRadius: '5px',
                padding: '5px 9px',
                fontWeight: '600',
              }}
            >
              Pendiente
            </span>
          </div>

          <div style={{ fontFamily: 'monospace' }}>$200.000</div>

          <div
            style={{
              color: '#39e67d',
              fontFamily: 'monospace',
            }}
          >
            $0
          </div>

          <div
            style={{
              color: '#ffb000',
              fontFamily: 'monospace',
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            $200.000
          </div>

          <div style={{ color: '#7da2ce', lineHeight: '1.5' }}>
            Acuerdo verbal. No han confirmado método de pago.
          </div>
        </div>

        {/* COPEC EMPRESAS */}
        <div style={filaStyle}>
          <div
            style={{
              fontWeight: '700',
              lineHeight: '1.4',
            }}
          >
            Copec
            <br />
            Empresas
          </div>

          <div>
            <div style={{ fontWeight: '600' }}>Lorena Bravo</div>
            <div style={textoSecundario}>lbravo@copec.cl</div>
            <div style={textoSecundario}>+56 9 4444 5555</div>
          </div>

          <div>
            <div style={{ fontWeight: '600', lineHeight: '1.4' }}>
              Torneo
              <br />
              Interempresas
              <br />
              Basketball
            </div>
            <div style={textoSecundario}>23-ago</div>
          </div>

          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#123d28',
                color: '#39e67d',
                border: '1px solid #1d5c3c',
                borderRadius: '5px',
                padding: '5px 9px',
                fontWeight: '600',
              }}
            >
              Pagado
            </span>
          </div>

          <div style={{ fontFamily: 'monospace' }}>$450.000</div>

          <div
            style={{
              color: '#39e67d',
              fontFamily: 'monospace',
            }}
          >
            $450.000
          </div>

          <div
            style={{
              color: '#39e67d',
              fontSize: '20px',
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            ✓
          </div>

          <div style={{ color: '#7da2ce', lineHeight: '1.5' }}>
            Sponsor recurrente. Factura emitida.
          </div>
        </div>

        {/* MOVISTAR DEPORTES */}
        <div
          style={{
            ...filaStyle,
            borderBottom: 'none',
          }}
        >
          <div
            style={{
              fontWeight: '700',
              lineHeight: '1.4',
            }}
          >
            Movistar
            <br />
            Deportes
          </div>

          <div>
            <div style={{ fontWeight: '600' }}>Jorge Castillo</div>
            <div style={textoSecundario}>jcastillo@movistar.cl</div>
            <div style={textoSecundario}>+56 9 5555 6666</div>
          </div>

          <div>
            <div style={{ fontWeight: '600', lineHeight: '1.4' }}>
              Final Copa
              <br />
              Chile Sub-17
            </div>
            <div style={textoSecundario}>30-ago</div>
          </div>

          <div>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#451c1c',
                color: '#ff5c5c',
                border: '1px solid #6a2929',
                borderRadius: '5px',
                padding: '5px 9px',
                fontWeight: '600',
              }}
            >
              Pendiente
            </span>
          </div>

          <div style={{ fontFamily: 'monospace' }}>$800.000</div>

          <div
            style={{
              color: '#39e67d',
              fontFamily: 'monospace',
            }}
          >
            $0
          </div>

          <div
            style={{
              color: '#ffb000',
              fontFamily: 'monospace',
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            $800.000
          </div>

          <div style={{ color: '#7da2ce', lineHeight: '1.5' }}>
            Pago pendiente de confirmación.
          </div>
        </div>
      </div>
    </main>
  )
}

export default AuspiciadoresPage