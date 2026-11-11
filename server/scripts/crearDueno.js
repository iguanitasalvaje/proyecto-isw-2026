'use strict';

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const readline = require('node:readline');
const { Writable } = require('node:stream');
const { ROLES } = require('../config/roles');
const { crearPool } = require('../db/pool');

function preguntar(mensaje) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on('SIGINT', () => {
      rl.close();
      reject(new Error('Operación cancelada.'));
    });

    rl.question(mensaje, (respuesta) => {
      rl.close();
      resolve(respuesta.trim());
    });
  });
}

function preguntarPassword(mensaje = 'Contraseña del Dueño: ') {
  return new Promise((resolve, reject) => {
    let password = '';

    // Si la terminal soporta raw mode (PowerShell, CMD, Windows Terminal, Git Bash con PTY o winpty)
    if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdout.write(mensaje);

      function onData(chunk) {
        const str = chunk.toString('utf8');
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '\u0003') { // Ctrl+C
            limpiar();
            reject(new Error('Operación cancelada.'));
            return;
          }

          if (char === '\r' || char === '\n') { // Enter (\r, \n o \r\n)
            limpiar();
            process.stdout.write('\n');
            resolve(password);
            return;
          }

          if (char === '\u007f' || char === '\b') { // Backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
            }
            continue;
          }

          if (char.charCodeAt(0) >= 32) {
            password += char;
          }
        }
      }

      function limpiar() {
        process.stdin.removeListener('data', onData);
        if (typeof process.stdin.setRawMode === 'function') {
          process.stdin.setRawMode(false);
        }
        process.stdin.pause();
      }

      process.stdin.on('data', onData);
    } else {
      // Fallback para entornos donde setRawMode no está disponible (ej. Git Bash MinTTY)
      let muted = false;
      const outputSilenciado = new Writable({
        write(chunk, encoding, callback) {
          if (!muted) {
            process.stdout.write(chunk, encoding);
          }
          callback();
        }
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: outputSilenciado,
        terminal: true
      });

      rl.on('SIGINT', () => {
        rl.close();
        reject(new Error('Operación cancelada.'));
      });

      rl.question(mensaje, (respuesta) => {
        rl.close();
        process.stdout.write('\n');
        resolve(respuesta);
      });

      muted = true;
    }
  });
}

// Parsea argumentos de línea de comandos opcionales (--email y --password)
function obtenerArgumentos() {
  const args = process.argv.slice(2);
  let emailArg = null;
  let passwordArg = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      emailArg = args[i + 1].trim();
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      passwordArg = args[i + 1];
      i++;
    }
  }

  return { emailArg, passwordArg };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está configurada en server/.env');
  }

  const { emailArg, passwordArg } = obtenerArgumentos();

  // Permite ejecución interactiva tanto en terminales TTY (PowerShell, CMD)
  // como en terminales basados en pipes como Git Bash (MinTTY).
  if (!emailArg && !passwordArg && !process.stdin.readable) {
    throw new Error('No se puede leer la entrada estándar. Proporciona --email y --password.');
  }

  const pool = crearPool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // 1. Verificación previa: impedir duplicados antes de solicitar datos
    const duenoExistente = await pool.query(
      'SELECT id, email FROM usuario WHERE rol = $1 LIMIT 1',
      [ROLES.DUENO]
    );

    if (duenoExistente.rowCount > 0) {
      throw new Error(
        `Ya existe una cuenta con rol Dueño registrada (${duenoExistente.rows[0].email}). No se permite crear duplicados.`
      );
    }

    let email = emailArg;
    let password = passwordArg;

    if (!email || !password) {
      console.log('\n=== Crear cuenta inicial del Dueño ===\n');
      if (!email) {
        email = (await preguntar('Correo del Dueño: ')).toLowerCase().trim();
      }
      if (!password) {
        password = await preguntarPassword();
      }
    } else {
      email = email.toLowerCase().trim();
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Debes ingresar un correo válido.');
    }

    if (password.length < 12) {
      throw new Error('La contraseña debe tener al menos 12 caracteres.');
    }

    // 2. Verificar que el correo no esté ocupado por otra cuenta
    const emailExistente = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 LIMIT 1',
      [email]
    );

    if (emailExistente.rowCount > 0) {
      throw new Error('El correo ingresado ya se encuentra registrado en el sistema.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const resultado = await pool.query(
        `INSERT INTO usuario (id, email, password_hash, rol)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, rol, activo, creado_en`,
        [randomUUID(), email, passwordHash, ROLES.DUENO]
      );

      console.log('\n✓ Cuenta de Dueño creada exitosamente.');
      console.log('ID:', resultado.rows[0].id);
      console.log('Correo:', resultado.rows[0].email);
      console.log('Rol:', resultado.rows[0].rol);
    } catch (insertError) {
      if (insertError.code === '23505') {
        throw new Error('Conflicto: ya existe un usuario registrado con este correo o rol.');
      }
      throw insertError;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('\nNo se pudo crear la cuenta:', error.message);
  process.exitCode = 1;
});
