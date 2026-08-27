/**
 * Bootstrap inicial de Prometeo (estilo Argos-RMM): limpia y crea el registro
 * inicial de la empresa (tenant CIDE SAS) + usuario administrador + perfiles
 * UNSPSC + API key Hermes. Reejecutable (idempotente).
 *
 * Uso: docker exec prometeo-backend node dist/bootstrap.js
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const NIT = '900.858.048-0';
const EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@cidesas.com';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Prometeo2026!';

// Líneas de negocio CIDE (UNSPSC) — fuente SRS 1.1
const UNSPSC = [
  '93141808', '80101601', // SG-SST
  '80101505', '81111801', '80101510', // ISO 22301 / DRP
  '81111800', '81111811', '81112000', '81111500', '81112005', '81112003', '81111818', // Infra TI / MSP
  '81101701', '83101901', '83101806', // Energía / FNCE
];

async function main() {
  console.log('=== Bootstrap Prometeo (empresa desde cero) ===');

  // 1. Limpiar datos existentes (orden por FK)
  console.log('Limpiando BD...');
  await prisma.financialLedger.deleteMany();
  await prisma.contractProject.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.documentLibrary.deleteMany();
  await prisma.aiConfiguration.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.unspscProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Crear la empresa (tenant CIDE SAS)
  const tenant = await prisma.tenant.create({
    data: {
      nombreComercial: 'CIDE SOLUCIONES PRÁCTICAS EMPRESARIALES S.A.S.',
      nit: NIT,
      configuracionesJson: {
        // Línea base financiera auditada 31/12/2025 (SRS 1.2)
        finanzas: {
          activoCorriente: 223567368,
          activoTotal: 226372332,
          pasivoCorriente: 160701011,
          patrimonioTotal: 65671321,
          utilidadOperacional: 27927701,
          gastosIntereses: 0,
          liquidez: 1.39,
          endeudamiento: 0.71,
          roe: 0.42,
          roa: 0.12,
        },
        // Conexión SECOP II (Módulo 1)
        secop: {
          sodaEndpoint: 'https://www.datos.gov.co/resource/p6dx-8zbt.json',
          appToken: process.env.SODA_APP_TOKEN || '',
          estadoFiltro: 'Presentación de ofertas',
          syncCron: '0 */6 * * *',
        },
        smmlv2026: 1450000,
      },
    },
  });
  console.log('✔ Empresa creada:', tenant.nombreComercial, '| id:', tenant.id);

  // 3. Usuario administrador
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EMAIL,
      passwordHash,
      nombre: 'Administrador Prometeo',
      rol: 'Admin',
      isActive: true,
      mustChangePassword: true, // cambio obligatorio en primer ingreso
    },
  });
  console.log('✔ Usuario admin creado:', user.email, '(cambio de contraseña obligatorio)');

  // 4. Perfiles UNSPSC
  for (const codigo of UNSPSC) {
    await prisma.unspscProfile.create({
      data: { tenantId: tenant.id, codigoUnspsc: codigo, descripcion: `UNSPSC ${codigo}` },
    });
  }
  console.log('✔ Perfiles UNSPSC:', UNSPSC.length);

  // 5. API key Hermes (alcance tenant, sin expirar)
  const hermesKey = crypto.randomBytes(24).toString('hex');
  await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      name: 'Hermes',
      keyHash: crypto.createHash('sha256').update(hermesKey).digest('hex'),
      prefix: 'prom_' + hermesKey.slice(0, 8),
    },
  });
  console.log('✔ API key Hermes creada (guardar UNA vez):');
  console.log('  KEY=' + hermesKey);

  console.log('\n=== Resumen ===');
  console.log('Empresa: CIDE SAS | NIT:', NIT);
  console.log('Admin:', EMAIL, '| Password:', PASSWORD, '(CAMBIAR en primer ingreso)');
  console.log('UNSPSC:', UNSPSC.length, 'códigos | API key Hermes generada');
  console.log('SECOP II: ingesta configurada con endpoint SODA p6dx-8zbt');
}

main()
  .catch((e) => {
    console.error('ERROR bootstrap:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
