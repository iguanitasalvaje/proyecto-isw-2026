import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ROLES } from '../../config/permisos';
import { useAuth } from '../../context/AuthContext';

export default function UsuariosPage() {
  const { usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorGlobal, setErrorGlobal] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(null); // objeto usuario a editar
  const [modalPassword, setModalPassword] = useState(null); // objeto usuario

  // Formulario Crear
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState(ROLES.CONTADOR);
  const [guardandoCrear, setGuardandoCrear] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  // Formulario Editar
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState(ROLES.CONTADOR);
  const [guardandoEditar, setGuardandoEditar] = useState(false);
  const [errorEditar, setErrorEditar] = useState('');

  // Formulario Password
  const [resetPassword, setResetPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState('');

  // Carga inicial de usuarios
  useEffect(() => {
    let activo = true;
    api('/usuarios')
      .then((data) => {
        if (activo) setUsuarios(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (activo) setErrorGlobal(err.message || 'No se pudo cargar la lista de usuarios.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Función para recargar después de operaciones CRUD
  const cargarUsuarios = async () => {
    try {
      const data = await api('/usuarios');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorGlobal(err.message || 'No se pudo cargar la lista de usuarios.');
    }
  };

  // Limpiar mensajes temporales
  const mostrarExito = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  // 1. Crear nuevo usuario (Contador o Jefe Técnico)
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorCrear('');

    if (nuevoPassword.length < 8) {
      setErrorCrear('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setGuardandoCrear(true);
      await api('/usuarios', {
        method: 'POST',
        body: {
          email: nuevoEmail.trim(),
          password: nuevoPassword,
          rol: nuevoRol
        }
      });

      setModalCrear(false);
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoRol(ROLES.CONTADOR);
      mostrarExito('Usuario creado correctamente.');
      await cargarUsuarios();
    } catch (err) {
      setErrorCrear(err.message || 'Error al crear el usuario.');
    } finally {
      setGuardandoCrear(false);
    }
  };

  // 2. Modificar correo o rol
  const abrirEditar = (u) => {
    setModalEditar(u);
    setEditEmail(u.email);
    setEditRol(u.rol === ROLES.DUENO ? ROLES.CONTADOR : u.rol);
    setErrorEditar('');
  };

  const handleEditarUsuario = async (e) => {
    e.preventDefault();
    setErrorEditar('');

    try {
      setGuardandoEditar(true);
      await api(`/usuarios/${modalEditar.id}`, {
        method: 'PATCH',
        body: {
          email: editEmail.trim(),
          rol: editRol
        }
      });

      setModalEditar(null);
      mostrarExito('Cuenta actualizada correctamente.');
      await cargarUsuarios();
    } catch (err) {
      setErrorEditar(err.message || 'Error al actualizar el usuario.');
    } finally {
      setGuardandoEditar(false);
    }
  };

  // 3. Activar / Desactivar cuenta
  const handleToggleEstado = async (u) => {
    const accion = u.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de que deseas ${accion} la cuenta de ${u.email}?`)) {
      return;
    }

    try {
      await api(`/usuarios/${u.id}/estado`, {
        method: 'PATCH',
        body: { activo: !u.activo }
      });

      mostrarExito(`Cuenta ${u.activo ? 'desactivada' : 'activada'} correctamente.`);
      await cargarUsuarios();
    } catch (err) {
      alert(err.message || 'No se pudo cambiar el estado de la cuenta.');
    }
  };

  // 4. Restablecer contraseña
  const abrirPassword = (u) => {
    setModalPassword(u);
    setResetPassword('');
    setErrorPassword('');
  };

  const handleRestablecerPassword = async (e) => {
    e.preventDefault();
    setErrorPassword('');

    if (resetPassword.length < 8) {
      setErrorPassword('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setGuardandoPassword(true);
      await api(`/usuarios/${modalPassword.id}/password`, {
        method: 'PATCH',
        body: { password: resetPassword }
      });

      setModalPassword(null);
      setResetPassword('');
      mostrarExito(`Contraseña restablecida exitosamente para ${modalPassword.email}.`);
    } catch (err) {
      setErrorPassword(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setGuardandoPassword(false);
    }
  };

  // Formatear badge de roles
  const formatoRol = (rol) => {
    switch (rol) {
      case ROLES.DUENO:
        return { nombre: 'Dueño', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)' };
      case ROLES.CONTADOR:
        return { nombre: 'Contador', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.3)' };
      case ROLES.JEFE_TECNICO:
        return { nombre: 'Jefe Técnico', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.3)' };
      default:
        return { nombre: rol, color: '#94a3b8', bg: '#1e293b', border: '#334155' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '32px 48px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #1e293b', pb: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
            Administración de Cuentas
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Panel de control exclusivo del Dueño para crear y gestionar accesos de Contador y Jefe Técnico (RF1).
          </p>
        </div>

        <button
          onClick={() => {
            setModalCrear(true);
            setErrorCrear('');
          }}
          style={{
            padding: '10px 18px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
          }}
        >
          + Nueva Cuenta
        </button>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#86efac', fontSize: '14px', marginBottom: '20px' }}>
          ✓ {mensajeExito}
        </div>
      )}

      {errorGlobal && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px', marginBottom: '20px' }}>
          ✕ {errorGlobal}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Cargando cuentas registradas...
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No hay cuentas de usuario registradas en el sistema.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#0b1120', color: '#64748b', borderBottom: '1px solid #1e293b' }}>
              <tr>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Usuario / Correo</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Rol Operativo</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Fecha Creación</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const configRol = formatoRol(u.rol);
                const esDueno = u.rol === ROLES.DUENO;
                const esPropiaCuenta = usuarioActual?.id === u.id;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      backgroundColor: !u.activo ? 'rgba(15, 23, 42, 0.6)' : 'transparent',
                      opacity: !u.activo ? 0.7 : 1
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.email}</div>
                      {esPropiaCuenta && (
                        <span style={{ fontSize: '11px', color: '#38bdf8' }}>Tu sesión activa</span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: configRol.color,
                          backgroundColor: configRol.bg,
                          border: `1px solid ${configRol.border}`
                        }}
                      >
                        {configRol.nombre}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: u.activo ? '#4ade80' : '#f87171'
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: u.activo ? '#4ade80' : '#f87171'
                          }}
                        />
                        {u.activo ? 'Activa' : 'Desactivada'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#94a3b8' }}>
                      {u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-CL') : '—'}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {esDueno ? (
                        <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                          Cuenta Dueño protegida
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => abrirEditar(u)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              color: '#cbd5e1',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Modificar
                          </button>

                          <button
                            onClick={() => handleToggleEstado(u)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: u.activo ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              border: u.activo ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                              color: u.activo ? '#f87171' : '#4ade80',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>

                          <button
                            onClick={() => abrirPassword(u)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              color: '#93c5fd',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Clave
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal 1: Crear Usuario */}
      {modalCrear && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '28px', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
              Crear Nueva Cuenta Operativa
            </h2>

            {errorCrear && (
              <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                {errorCrear}
              </div>
            )}

            <form onSubmit={handleCrearUsuario}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  placeholder="ejemplo@sixseven.cl"
                  required
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0b1120', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Contraseña Inicial (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0b1120', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Rol de Acceso
                </label>
                <select
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0b1120', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value={ROLES.CONTADOR}>Contador (Finanzas, Eventos, Auspiciadores, Reportes)</option>
                  <option value={ROLES.JEFE_TECNICO}>Jefe Técnico (Inventario)</option>
                </select>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Nota: Solo se pueden crear cuentas de Contador y Jefe Técnico.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalCrear(false)}
                  style={{ padding: '9px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCrear}
                  style={{ padding: '9px 18px', backgroundColor: '#2563eb', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: guardandoCrear ? 'not-allowed' : 'pointer' }}
                >
                  {guardandoCrear ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Modificar Cuenta */}
      {modalEditar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '28px', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
              Modificar Cuenta
            </h2>

            {errorEditar && (
              <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                {errorEditar}
              </div>
            )}

            <form onSubmit={handleEditarUsuario}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0b1120', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Rol de Acceso
                </label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0b1120', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value={ROLES.CONTADOR}>Contador</option>
                  <option value={ROLES.JEFE_TECNICO}>Jefe Técnico</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalEditar(null)}
                  style={{ padding: '9px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEditar}
                  style={{ padding: '9px 18px', backgroundColor: '#2563eb', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: guardandoEditar ? 'not-allowed' : 'pointer' }}
                >
                  {guardandoEditar ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Restablecer Contraseña */}
      {modalPassword && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '28px', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>
              Restablecer Contraseña
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Ingresa la nueva contraseña para <strong>{modalPassword.email}</strong>.
            </p>

            {errorPassword && (
              <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                {errorPassword}
              </div>
            )}

            <form onSubmit={handleRestablecerPassword}>
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Nueva Contraseña (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0b1120', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalPassword(null)}
                  style={{ padding: '9px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPassword}
                  style={{ padding: '9px 18px', backgroundColor: '#2563eb', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: guardandoPassword ? 'not-allowed' : 'pointer' }}
                >
                  {guardandoPassword ? 'Actualizando...' : 'Restablecer Clave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
