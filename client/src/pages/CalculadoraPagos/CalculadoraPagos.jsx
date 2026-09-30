import { useState } from "react";
import "./CalculadoraPagos.css";

function CalculadoraPagos() {
  const [evento, setEvento] = useState("");
  const [montoEvento, setMontoEvento] = useState(350000);

  const [personas, setPersonas] = useState([
    { id: 1, nombre: "Camarógrafo", porcentaje: 10 },
    { id: 2, nombre: "Director", porcentaje: 15 },
    { id: 3, nombre: "Sonidista", porcentaje: 8 },
  ]);

  const formatearDinero = (valor) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);

  const totalPorcentaje = personas.reduce(
    (total, persona) => total + Number(persona.porcentaje || 0),
    0
  );

  const totalDistribuido = personas.reduce(
    (total, persona) =>
      total + montoEvento * (Number(persona.porcentaje || 0) / 100),
    0
  );

  const restante = montoEvento - totalDistribuido;

  const actualizarPersona = (id, campo, valor) => {
    setPersonas((actuales) =>
      actuales.map((persona) =>
        persona.id === id ? { ...persona, [campo]: valor } : persona
      )
    );
  };

  const agregarPersona = () => {
    setPersonas((actuales) => [
      ...actuales,
      {
        id: Date.now(),
        nombre: "",
        porcentaje: 0,
      },
    ]);
  };

  const eliminarPersona = (id) => {
    setPersonas((actuales) =>
      actuales.filter((persona) => persona.id !== id)
    );
  };

  const limpiar = () => {
    setPersonas([
      { id: 1, nombre: "", porcentaje: 0 },
      { id: 2, nombre: "", porcentaje: 0 },
      { id: 3, nombre: "", porcentaje: 0 },
    ]);

    setEvento("");
    setMontoEvento(0);
  };

  const cargarEvento = (valor) => {
    setEvento(valor);

    if (valor === "campeonato") {
      setMontoEvento(350000);
      setPersonas([
        { id: 1, nombre: "Camarógrafo", porcentaje: 10 },
        { id: 2, nombre: "Director", porcentaje: 15 },
        { id: 3, nombre: "Sonidista", porcentaje: 8 },
      ]);
    }

    if (valor === "graduacion") {
      setMontoEvento(500000);
      setPersonas([
        { id: 1, nombre: "Director", porcentaje: 15 },
        { id: 2, nombre: "Camarógrafo", porcentaje: 10 },
        { id: 3, nombre: "Audio", porcentaje: 12 },
      ]);
    }
  };

  return (
    <div className="pagos-app">
      <aside className="pagos-sidebar">
        <div className="pagos-marca">
          <div className="pagos-logo">67</div>

          <div>
            <strong>Six Seven</strong>
            <span>TRANSMISIONES</span>
          </div>
        </div>

        <p className="pagos-label">PERFIL ACTIVO</p>

        <button className="pagos-perfil activo">Dueño</button>
        <button className="pagos-perfil">Contador</button>
        <button className="pagos-perfil">Jefe Técnico</button>

        <nav className="pagos-menu">
          <button>▣ Dashboard</button>
          <button>▹ Eventos</button>
          <button>◇ Inventario</button>
          <button>♙ Personal</button>
          <button>☆ Auspiciadores</button>
          <button>$ Finanzas</button>
          <button>▤ Reportes</button>
          <button className="activo">▧ Calculadora Pagos</button>
        </nav>

        <div className="pagos-usuario">● Dueño</div>
      </aside>

      <main className="pagos-contenido">
        <header className="pagos-header">
          <h1>Calculadora de Pagos</h1>

          <p>
            Distribuye el pago de un evento entre los participantes por
            porcentaje
          </p>
        </header>

        <section className="pagos-evento">
          <label>Cargar desde evento:</label>

          <select
            value={evento}
            onChange={(e) => cargarEvento(e.target.value)}
          >
            <option value="">— Seleccionar evento —</option>
            <option value="campeonato">
              Final Campeonato Regional
            </option>
            <option value="graduacion">
              Graduación Ingeniería Civil
            </option>
          </select>
        </section>

        <section className="pagos-tabla">
          <div className="pagos-tabla-header">
            <span>NOMBRE</span>
            <span>PORCENTAJE</span>
            <span>TOTAL DEL PAGO</span>
            <span></span>
          </div>

          {personas.map((persona) => {
            const pago =
              montoEvento *
              (Number(persona.porcentaje || 0) / 100);

            return (
              <div className="pagos-fila" key={persona.id}>
                <input
                  type="text"
                  placeholder="nombre"
                  value={persona.nombre}
                  onChange={(e) =>
                    actualizarPersona(
                      persona.id,
                      "nombre",
                      e.target.value
                    )
                  }
                />

                <div className="pagos-porcentaje">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={persona.porcentaje}
                    onChange={(e) =>
                      actualizarPersona(
                        persona.id,
                        "porcentaje",
                        e.target.value
                      )
                    }
                  />

                  <span>%</span>
                </div>

                <div className="pagos-total-persona">
                  {persona.porcentaje > 0
                    ? formatearDinero(pago)
                    : "—"}
                </div>

                <button
                  className="pagos-eliminar"
                  onClick={() => eliminarPersona(persona.id)}
                >
                  −
                </button>
              </div>
            );
          })}
        </section>

        <section className="pagos-controles">
          <div className="pagos-controles-izquierda">
            <span className="pagos-porcentaje-total">
              {totalPorcentaje}%
            </span>

            <button
              className="pagos-limpiar"
              onClick={limpiar}
            >
              Limpiar
            </button>
          </div>

          <button
            className="pagos-agregar"
            onClick={agregarPersona}
          >
            +
          </button>
        </section>

        <section className="pagos-resultados">
          <div className="pagos-monto">
            <span>MONTO PAGADO POR EVENTO</span>

            <input
              type="number"
              min="0"
              value={montoEvento}
              onChange={(e) =>
                setMontoEvento(Number(e.target.value))
              }
            />

            <small>Ingresa el monto total del evento</small>
          </div>

          <div className="pagos-ganancias">
            <span>RESULTADOS · GANANCIAS DEL EVENTO</span>

            <div className="pagos-resultado-linea">
              <p>Total distribuido</p>
              <strong>
                {formatearDinero(totalDistribuido)}
              </strong>
            </div>

            <div className="pagos-resultado-linea">
              <p>Monto restante</p>
              <strong
                className={restante < 0 ? "negativo" : ""}
              >
                {formatearDinero(restante)}
              </strong>
            </div>

            <div className="pagos-resultado-linea">
              <p>Porcentaje asignado</p>
              <strong>{totalPorcentaje}%</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CalculadoraPagos;