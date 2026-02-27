import { Migration } from '@mikro-orm/migrations';

export class Migration20260227162925_create_tenants extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "tenants" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "name" varchar(255) not null, "subdomain" varchar(255) not null, "contact_email" varchar(255) not null, "is_active" boolean not null, constraint "tenants_pkey" primary key ("id"));`,
		);
		this.addSql(
			`alter table "tenants" add constraint "tenants_subdomain_unique" unique ("subdomain");`,
		);

		this.addSql(
			`alter table "refresh_tokens" drop constraint "refresh_tokens_pkey";`,
		);
		this.addSql(
			`alter table "refresh_tokens" drop column "_created_at", drop column "_updated_at";`,
		);

		this.addSql(
			`alter table "refresh_tokens" add column "created_at" timestamptz not null default now(), add column "updated_at" timestamptz not null default now();`,
		);
		this.addSql(`alter table "refresh_tokens" rename column "_id" to "id";`);
		this.addSql(
			`alter table "refresh_tokens" add constraint "refresh_tokens_pkey" primary key ("id");`,
		);

		this.addSql(`alter table "users" drop constraint "users_pkey";`);
		this.addSql(
			`alter table "users" drop column "_created_at", drop column "_updated_at";`,
		);

		this.addSql(
			`alter table "users" add column "created_at" timestamptz not null default now(), add column "updated_at" timestamptz not null default now();`,
		);
		this.addSql(`alter table "users" rename column "_id" to "id";`);
		this.addSql(
			`alter table "users" add constraint "users_pkey" primary key ("id");`,
		);

		this.addSql(
			`alter table "user_tenant_memberships" drop constraint "user_tenant_memberships_pkey";`,
		);
		this.addSql(
			`alter table "user_tenant_memberships" drop column "_created_at", drop column "_updated_at";`,
		);

		this.addSql(
			`alter table "user_tenant_memberships" add column "created_at" timestamptz not null default now(), add column "updated_at" timestamptz not null default now();`,
		);
		this.addSql(
			`alter table "user_tenant_memberships" rename column "_id" to "id";`,
		);
		this.addSql(
			`alter table "user_tenant_memberships" add constraint "user_tenant_memberships_pkey" primary key ("id");`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "tenants" cascade;`);

		this.addSql(
			`alter table "refresh_tokens" drop constraint "refresh_tokens_pkey";`,
		);
		this.addSql(
			`alter table "refresh_tokens" drop column "created_at", drop column "updated_at";`,
		);

		this.addSql(
			`alter table "refresh_tokens" add column "_created_at" timestamptz not null default now(), add column "_updated_at" timestamptz not null default now();`,
		);
		this.addSql(`alter table "refresh_tokens" rename column "id" to "_id";`);
		this.addSql(
			`alter table "refresh_tokens" add constraint "refresh_tokens_pkey" primary key ("_id");`,
		);

		this.addSql(`alter table "users" drop constraint "users_pkey";`);
		this.addSql(
			`alter table "users" drop column "created_at", drop column "updated_at";`,
		);

		this.addSql(
			`alter table "users" add column "_created_at" timestamptz not null default now(), add column "_updated_at" timestamptz not null default now();`,
		);
		this.addSql(`alter table "users" rename column "id" to "_id";`);
		this.addSql(
			`alter table "users" add constraint "users_pkey" primary key ("_id");`,
		);

		this.addSql(
			`alter table "user_tenant_memberships" drop constraint "user_tenant_memberships_pkey";`,
		);
		this.addSql(
			`alter table "user_tenant_memberships" drop column "created_at", drop column "updated_at";`,
		);

		this.addSql(
			`alter table "user_tenant_memberships" add column "_created_at" timestamptz not null default now(), add column "_updated_at" timestamptz not null default now();`,
		);
		this.addSql(
			`alter table "user_tenant_memberships" rename column "id" to "_id";`,
		);
		this.addSql(
			`alter table "user_tenant_memberships" add constraint "user_tenant_memberships_pkey" primary key ("_id");`,
		);
	}
}
