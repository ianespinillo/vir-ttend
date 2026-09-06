import { MikroORM } from '@mikro-orm/postgresql';
import { hash } from 'bcryptjs';
import { config } from 'dotenv';

config();

async function seed() {
	const dbUrl =
		process.env.DATABASE_URL ||
		'postgresql://postgres:postgres@localhost:5436/public';

	const orm = await MikroORM.init({
		clientUrl: dbUrl,
		discovery: { warnWhenNoEntities: false },
	});

	const em = orm.em.fork();

	const hashedPassword = await hash('admin123!A', 10);
	const tenantId = '11111111-1111-1111-1111-111111111111';
	const userId = '22222222-2222-2222-2222-222222222222';
	const membershipId = '33333333-3333-3333-3333-333333333333';

	await em.execute(`
		INSERT INTO tenants (id, name, subdomain, contact_email, is_active, created_at, updated_at)
		VALUES ('${tenantId}', 'Escuela Demo', 'demo', 'admin@escuela.edu.ar', true, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET is_active = true;
	`);

	await em.execute(`
		INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, must_change_password, created_at, updated_at)
		VALUES ('${userId}', 'admin@escuela.edu.ar', '${hashedPassword}', 'Admin', 'Sistema', true, false, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET password_hash = '${hashedPassword}', is_active = true;
	`);

	await em.execute(`
		INSERT INTO user_tenant_memberships (id, user_id, tenant_id, role, is_active, created_at, updated_at)
		VALUES ('${membershipId}', '${userId}', '${tenantId}', 'ADMIN', true, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET is_active = true, role = 'ADMIN';
	`);

	console.log('✅ Seed finalizado con éxito!');
	console.log('-----------------------------------');
	console.log('Email:    admin@escuela.edu.ar');
	console.log('Password: admin123!A');
	console.log('Tenant:   Escuela Demo');
	console.log('-----------------------------------');

	await orm.close();
}

seed().catch(console.error);
