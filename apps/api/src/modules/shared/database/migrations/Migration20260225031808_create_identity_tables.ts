import { Migration } from '@mikro-orm/migrations';

export class Migration20260225031808_create_identity_tables extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "refresh_tokens" ("_id" uuid not null default gen_random_uuid(), "_created_at" timestamptz not null default now(), "_updated_at" timestamptz not null default now(), "user_id" varchar(255) not null, "tenant_id" varchar(255) not null, "token" varchar(255) not null, "expires_at" timestamptz not null, "revoked_at" timestamptz null, constraint "refresh_tokens_pkey" primary key ("_id"));`,
		);

		this.addSql(
			`create table "users" ("_id" uuid not null default gen_random_uuid(), "_created_at" timestamptz not null default now(), "_updated_at" timestamptz not null default now(), "email" varchar(255) not null, "password_hash" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "is_active" boolean not null, "must_change_password" boolean not null, constraint "users_pkey" primary key ("_id"));`,
		);

		this.addSql(
			`create table "user_tenant_memberships" ("_id" uuid not null default gen_random_uuid(), "_created_at" timestamptz not null default now(), "_updated_at" timestamptz not null default now(), "user_id" varchar(255) not null, "tenant_id" varchar(255) not null, "role" varchar(255) not null, "is_active" boolean not null, constraint "user_tenant_memberships_pkey" primary key ("_id"));`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "refresh_tokens" cascade;`);

		this.addSql(`drop table if exists "users" cascade;`);

		this.addSql(`drop table if exists "user_tenant_memberships" cascade;`);
	}
}
