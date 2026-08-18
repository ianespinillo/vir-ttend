import { Migration } from '@mikro-orm/migrations';

export class Migration20260730032324_create_monthly_reports extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "monthly_reports" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "tenant_id" uuid not null, "course_id" uuid not null, "academic_year_id" uuid not null, "month" smallint not null, "year" smallint not null, "data" jsonb not null, "generated_at" timestamptz not null, constraint "monthly_reports_pkey" primary key ("id"));`,
		);
		this.addSql(
			`create index "monthly_reports_course_id_index" on "monthly_reports" ("course_id");`,
		);
		this.addSql(
			`alter table "monthly_reports" add constraint "monthly_reports_course_id_month_year_unique" unique ("course_id", "month", "year");`,
		);

		this.addSql(
			`alter table "attendance_alerts" alter column "seen_by" drop default;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_by" type uuid using ("seen_by"::text::uuid);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_by" drop not null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_at" type date using ("seen_at"::date);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_at" drop not null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "created_at" set default now();`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "monthly_reports" cascade;`);

		this.addSql(
			`alter table "attendance_alerts" alter column "seen_by" drop default;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_by" type uuid using ("seen_by"::text::uuid);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_by" set not null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_at" type date using ("seen_at"::date);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_at" set not null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "created_at" set default now();`,
		);
	}
}
