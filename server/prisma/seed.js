const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EQUIPOS = [
  { nombre: 'Sony FX3 #1', tipo: 'Cámara', serie: 'SN-FX3-001', estado: 'Disponible', valorReposicion: 3500000 },
  { nombre: 'Sony FX3 #2', tipo: 'Cámara', serie: 'SN-FX3-002', estado: 'En Uso', valorReposicion: 3500000 },
  { nombre: 'Canon C70 #1', tipo: 'Cámara', serie: 'CN-C70-001', estado: 'Disponible', valorReposicion: 4000000 },
  { nombre: 'Trípode Manfrotto #1', tipo: 'Trípode', serie: 'MF-T100-001', estado: 'Disponible', valorReposicion: 450000 },
  { nombre: 'Trípode Manfrotto #2', tipo: 'Trípode', serie: 'MF-T100-002', estado: 'Dañado', valorReposicion: 450000 },
  { nombre: 'Cable HDMI 15m #1', tipo: 'Cable', serie: 'HDMI-15-001', estado: 'Disponible', valorReposicion: 35000 },
  { nombre: 'Cable HDMI 15m #2', tipo: 'Cable', serie: 'HDMI-15-002', estado: 'Perdido', valorReposicion: 35000 },
  { nombre: 'Mezcladora Blackmagic ATEM Mini', tipo: 'Switch', serie: 'BM-AM-001', estado: 'Disponible', valorReposicion: 800000 },
  { nombre: 'Consola Audio Yamaha MG10', tipo: 'Audio', serie: 'YM-MG10-001', estado: 'Disponible', valorReposicion: 320000 },
  { nombre: 'Micrófono Sennheiser XSW-D', tipo: 'Micrófono', serie: 'SN-XSD-001', estado: 'Disponible', valorReposicion: 280000 },
  { nombre: 'Monitor Feelworld 7"', tipo: 'Monitor', serie: 'FW-M7-001', estado: 'Disponible', valorReposicion: 250000 },
  { nombre: 'Batería LP-E6 x4', tipo: 'Batería', serie: 'BAT-LPE6-SET1', estado: 'Disponible', valorReposicion: 120000 },
  { nombre: 'Drone DJI Mini 3 Pro', tipo: 'Drone', serie: 'DJI-M3P-001', estado: 'Disponible', valorReposicion: 900000 },
  { nombre: 'Laptop Edición #1', tipo: 'Laptop', serie: 'LPT-EDIT-001', estado: 'En Uso', valorReposicion: 1500000 }
];

const KITS = [
  { nombre: 'Kit Fútbol Completo', descripcion: 'Setup de 3 cámaras para partidos de fútbol profesional' },
  { nombre: 'Kit Graduación', descripcion: 'Transmisión de ceremonias de grado con audio profesional' },
  { nombre: 'Kit Corporativo', descripcion: 'Eventos empresariales compactos con streaming directo' },
  { nombre: 'Kit Drone Aéreo', descripcion: 'Tomas aéreas para eventos al aire libre' }
];

async function main() {
  console.log('🌱 Poblando base de datos en la UBB...');

  // 1. Insertar o actualizar Equipos (usando 'serie' como campo único)
  for (const eq of EQUIPOS) {
    await prisma.equipo.upsert({
      where: { serie: eq.serie },
      update: {},
      create: eq,
    });
  }

  // 2. Insertar Kits comprobando si ya existen por nombre
  if (prisma.kit) {
    for (const kit of KITS) {
      const existeKit = await prisma.kit.findFirst({
        where: { nombre: kit.nombre },
      });

      if (!existeKit) {
        await prisma.kit.create({
          data: kit,
        });
      }
    }
  }

  console.log('✅ Base de datos poblada con éxito con equipos y kits.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });