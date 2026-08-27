/**
 * Seed inicial de Prometeo — tenant semilla CIDE SAS + usuario admin + API key Hermes.
 * Ejecutar tras el primer `prisma db push`:
 *   docker compose -f docker-compose.prod.yml run --rm backend node dist/seed.js
 * (o: npx ts-node src/seed.ts en dev)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@cidesas.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'CambiarClave123!';
  const nit = '900.858.048-0';

  // 1. Tenant semilla: CIDE SAS
  let tenant = await prisma.tenant.findUnique({ where: { nit } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        nombreComercial: 'CIDE SOLUCIONES PRÁCTICAS EMPRESARIALES S.A.S.',
        nit,
        configuracionesJson: {
          // Línea base financiera auditada 31/12/2025
          finanzas: {
            activoCorriente: 223567368,
            activoTotal: 226372332,
            pasivoCorriente: 160701011,
            patrimonioTotal: 65671321,
            utilidadOperacional: 27927701,
            gastosIntereses: 0,
          },
          // Códigos UNSPSC de las líneas de negocio de CIDE
          unspsc: [
            '93141808', '80101601', '80101505', '81111801', '80101510',
            '81111800', '81111811', '81112000', '81111500', '81112005',
            '81112003', '81111818', '81101701', '83101901', '83101806',
          ],
        },
      },
    });
    console.log('Tenant CIDE SAS creado:', tenant.id);
  } else {
    console.log('Tenant CIDE SAS ya existe:', tenant.id);
  }

  // 2. Usuario admin
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: {},
    create: {
      tenantId: tenant.id,
      email,
      passwordHash,
      nombre: 'Administrador Prometeo',
      rol: 'Admin',
    },
  });
  console.log('Usuario admin listo:', user.email);

  // 3. Perfiles UNSPSC del tenant
  const unspsc = (tenant.configuracionesJson as any)?.unspsc || [];
  for (const codigo of unspsc) {
    await prisma.unspscProfile.upsert({
      where: { id: undefined as any }, // upsert por tenant+codigo no soportado en Prisma; usar find
      update: {},
      create: { tenantId: tenant.id, codigoUnspsc: codigo },
    }).catch(() => {});
  }
  // Upsert correcto por combinación
  const existing = await prisma.unspscProfile.findMany({ where: { tenantId: tenant.id } });
  for (const codigo of unspsc) {
    if (!existing.some((e) => e.codigoUnspsc === codigo)) {
      await prisma.unspscProfile.create({ data: { tenantId: tenant.id, codigoUnspsc: codigo } });
    }
  }
  console.log('Perfiles UNSPSC configurados:', unspsc.length);

  // 4. API key Hermes (patrón ecosistema: x-api-key, alcance por tenant, sin expirar)
  const hermesKey = crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(hermesKey).digest('hex');
  await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      name: 'Hermes',
      keyHash,
      prefix: 'prom_' + hermesKey.slice(0, 8),
    },
  });
  console.log('API key Hermes creada (guardar UNA vez):');
  console.log('  KEY=' + hermesKey);
  console.log('  ALCANCE=tenant CIDE SAS (admin del tenant)');
  console.log('  GUARDAR EN /opt/data/keys/hermes_prometeo.txt');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
