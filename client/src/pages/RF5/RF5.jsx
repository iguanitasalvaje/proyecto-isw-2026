import { useState } from "react";
import "./RF5.css";

function RF5() {
  const [mostrarModal, setMostrarModal] = useState(false);

  const precioBase = 350000;
  const porcentajeRecargo = 20;
  const recargo = precioBase * (porcentajeRecargo / 100);
  const total = precioBase + recargo;

  const kits = [
    {
      nombre: "Kit Fútbol Completo",
      descripcion: "Setup de 3 cámaras para partidos de fútbol profesional",
      cantidad: 7,
      color: "azul",
      premium: true,
      recargo: 20,
      equipos: [
        "Sony FX3 #1",
        "Sony FX3 #2",
        "Canon C70 #1",
        "Trípode Manfrotto #1",
        "Cable HDMI 15m #1",
        "Mezcladora ATEM Mini",
        'Monitor Feelworld 7"',
      ],
    },
    {
      nombre: "Kit Graduación",
      descripcion: "Transmisión de ceremonias de grado con audio profesional",
      cantidad: 6,
      color: "morado",
      premium: false,
      equipos: [
        "Canon C70 #1",
        "Trípode Manfrotto #1",
        "Cable HDMI 15m #1",
        "Consola Audio Yamaha MG10",
        "Micrófono Sennheiser",
        'Monitor Feelworld 7"',
      ],
    },
    {
      nombre: "Kit Corporativo",
      descripcion: "Eventos empresariales compactos con streaming directo",
      cantidad: 5,
      color: "naranjo",
      premium: true,
      recargo: 15,
      equipos: [
        "Sony FX3 #1",
        "Cable HDMI 15m #1",
        "Mezcladora ATEM Mini",
        "Consola Audio Yamaha MG10",
        "Laptop Edición #1",
      ],
    },
    {
      nombre: "Kit Drone Aéreo",
      descripcion: "Tomas aéreas para eventos al aire libre",
      cantidad: 3,
      color: "verde",
      premium: false,
      equipos: ['Monitor Feelworld 7"', "Batería LP-E6 x4", "Drone DJI Mini 3 Pro"],
    },
  ];

  const formatearDinero = (valor) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(valor);

  return (
    <div className="rf5-app">
      <aside className="rf5-sidebar">
        <div className="rf5-marca">
          <div className="rf5-logo">67</div>
          <div>
            <strong>Six Seven</strong>
            <span>TRANSMISIONES</span>
          </div>
        </div>

        <p className="rf5-label">PERFIL ACTIVO</p>

        <button className="rf5-perfil activo">Dueño</button>
        <button className="rf5-perfil">Contador</button>
        <button className="rf5-perfil">Jefe Técnico</button>

        <nav className="rf5-menu">
          <button>▣ Dashboard</button>
          <button>▹ Eventos</button>
          <button className="activo">◇ Inventario</button>
          <button>♙ Personal</button>
          <button>☆ Auspiciadores</button>
          <button>$ Finanzas</button>
          <button>▤ Reportes</button>
          <button>▧ Calculadora Pagos</button>
        </nav>

        <div className="rf5-usuario">● Dueño</div>
      </aside>

      <main className="rf5-contenido">
        <header className="rf5-header">
          <div>
            <h1>Inventario</h1>
            <p>14 equipos registrados · 4 kits configurados</p>
          </div>

          <div className="rf5-acciones">
            <button className="boton-primario">+ Nuevo Kit</button>
            <button className="boton-secundario">+ Nuevo Equipo</button>
          </div>
        </header>

        <section className="rf5-estadisticas">
          <article>
            <span>DISPONIBLES</span>
            <strong className="verde">10</strong>
          </article>

          <article>
            <span>EN USO</span>
            <strong className="azul">2</strong>
          </article>

          <article>
            <span>DAÑADOS</span>
            <strong className="amarillo">1</strong>
          </article>

          <article>
            <span>PERDIDOS</span>
            <strong className="rojo">1</strong>
          </article>
        </section>

        <div className="rf5-tabs">
          <button className="activo">Kits</button>
          <button>Todos los Equipos</button>
          <button>Dados de Baja</button>
        </div>

        <section className="rf5-kits">
          {kits.map((kit) => (
            <article
              className={`rf5-kit rf5-kit-${kit.color}`}
              key={kit.nombre}
            >
              <div className="rf5-kit-header">
                <div>
                  <div className="rf5-titulo-kit">
                    <h2>{kit.nombre}</h2>

                    {kit.premium && (
                      <span className="premium">PREMIUM +{kit.recargo}%</span>
                    )}
                  </div>

                  <p>{kit.descripcion}</p>
                </div>

                <button className="editar">Editar</button>
              </div>

              <strong className="rf5-cantidad">
                {kit.cantidad} equipos
              </strong>

              <div className="rf5-etiquetas">
                {kit.equipos.map((equipo) => (
                  <span key={equipo}>{equipo}</span>
                ))}
              </div>

              {kit.premium && (
                <div className="rf5-premium-info">
                  <div>
                    <span>Recargo automático</span>
                    <strong>+{kit.recargo}% sobre precio base</strong>
                  </div>

                  <button onClick={() => setMostrarModal(true)}>
                    Asignar a evento
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      </main>

      {mostrarModal && (
        <div className="rf5-modal-fondo">
          <div className="rf5-modal">
            <div className="rf5-modal-header">
              <div>
                <span className="premium">KIT PREMIUM</span>
                <h2>Asignar Kit a Evento</h2>
              </div>

              <button
                className="cerrar"
                onClick={() => setMostrarModal(false)}
              >
                ×
              </button>
            </div>

            <label>Evento</label>
            <select defaultValue="campeonato">
              <option value="campeonato">
                Final Campeonato Regional
              </option>
              <option value="graduacion">
                Graduación Ingeniería Civil
              </option>
            </select>

            <div className="rf5-resumen">
              <div>
                <span>Precio base</span>
                <strong>{formatearDinero(precioBase)}</strong>
              </div>

              <div>
                <span>Kit seleccionado</span>
                <strong>Kit Fútbol Completo</strong>
              </div>

              <div>
                <span>Recargo Premium</span>
                <strong className="azul">+{porcentajeRecargo}%</strong>
              </div>

              <div>
                <span>Recargo</span>
                <strong>{formatearDinero(recargo)}</strong>
              </div>

              <div className="rf5-total">
                <span>Nuevo total del evento</span>
                <strong>{formatearDinero(total)}</strong>
              </div>
            </div>

            <p className="rf5-nota">
              Vista demostrativa del RF5. El recargo será calculado
              automáticamente por el sistema al asignar un Kit Premium.
            </p>

            <div className="rf5-modal-acciones">
              <button
                className="boton-secundario"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>

              <button
                className="boton-primario"
                onClick={() => setMostrarModal(false)}
              >
                Asignar Kit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RF5;