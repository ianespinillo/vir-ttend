import { Migration } from '@mikro-orm/migrations';

export class Migration20261016023715 extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "announcements" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "school_id" uuid not null, "tenant_id" uuid not null, "author_id" uuid not null, "title" varchar(255) not null, "body" text not null, "target_type" varchar(255) not null, "target_id" varchar(255) null, "status" varchar(255) not null, "publish_at" timestamptz null, constraint "announcements_pkey" primary key ("id"));`,
		);
		this.addSql(
			`create index "announcements_school_id_status_publish_at_index" on "announcements" ("school_id", "status", "publish_at");`,
		);

		this.addSql(
			`create table "workshop_attendance_records" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "tenant_id" uuid not null, "workshop_commission_id" uuid not null, "course_id" uuid not null, "student_id" uuid not null, "date" date not null, "status" varchar(255) not null, "edited_by" uuid not null, "edited_at" timestamptz not null, constraint "workshop_attendance_records_pkey" primary key ("id"));`,
		);
		this.addSql(
			`create index "workshop_attendance_records_workshop_commission_id_date_index" on "workshop_attendance_records" ("workshop_commission_id", "date");`,
		);
		this.addSql(
			`alter table "workshop_attendance_records" add constraint "workshop_attendance_records_commission_student_date_unique" unique ("workshop_commission_id", "student_id", "date");`,
		);

		this.addSql(
			`create table "workshop_commissions" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "tenant_id" varchar(255) not null, "course_id" uuid not null, "number" smallint not null, "preceptor_id" uuid null, constraint "workshop_commissions_pkey" primary key ("id"));`,
		);
		this.addSql(
			`alter table "workshop_commissions" add constraint "workshop_commissions_course_id_number_unique" unique ("course_id", "number");`,
		);

		this.addSql(
			`drop index "attendance_alerts_student_id_academic_year_id_alert_type_index";`,
		);

		this.addSql(
			`alter table "attendance_alerts" add column "absence_count" real not null, add column "threshold" int not null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "absence_percent" type real using ("absence_percent"::real);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "absence_percent" drop not null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" add constraint "attendance_alerts_student_year_type_unique" unique ("student_id", "academic_year_id", "alert_type");`,
		);

		this.addSql(
			`create unique index "attendanceRecord_daily_unique" on "attendanceRecord" ("course_id", "student_id", "date") where "subject_id" is null;`,
		);

		this.addSql(
			`alter table "courses" alter column "preceptor_id" drop default;`,
		);
		this.addSql(
			`alter table "courses" alter column "preceptor_id" type uuid using ("preceptor_id"::text::uuid);`,
		);
		this.addSql(
			`alter table "courses" alter column "preceptor_id" drop not null;`,
		);
		this.addSql(
			`alter table "courses" alter column "division" type varchar(255) using ("division"::varchar(255));`,
		);

		this.addSql(
			`alter table "students" add column "workshop_commission_id" uuid null;`,
		);

		this.addSql(
			`alter table "subjects" add column "kind" varchar(255) not null default 'theory';`,
		);
		this.addSql(
			`alter table "subjects" alter column "teacher_id" type varchar(255) using ("teacher_id"::varchar(255));`,
		);
		this.addSql(
			`alter table "subjects" alter column "teacher_id" drop not null;`,
		);

		this.addSql(
			`alter table "schedule_slots" add column "commission_number" smallint null;`,
		);

		this.addSql(`drop type "DAYOFWEEK";`);
	}

	override async down(): Promise<void> {
		this.addSql(
			`create type "DAYOFWEEK" as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');`,
		);
		this.addSql(`drop table if exists "announcements" cascade;`);

		this.addSql(`drop table if exists "workshop_attendance_records" cascade;`);

		this.addSql(`drop table if exists "workshop_commissions" cascade;`);

		this.addSql(
			`alter table "attendance_alerts" drop constraint "attendance_alerts_student_year_type_unique";`,
		);
		this.addSql(
			`alter table "attendance_alerts" drop column "absence_count", drop column "threshold";`,
		);

		this.addSql(
			`alter table "attendance_alerts" alter column "absence_percent" type real using ("absence_percent"::real);`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "absence_percent" set not null;`,
		);
		this.addSql(
			`create index "attendance_alerts_student_id_academic_year_id_alert_type_index" on "attendance_alerts" ("student_id", "academic_year_id", "alert_type");`,
		);

		this.addSql(
			`alter table "attendanceRecord" drop constraint "attendanceRecord_daily_unique";`,
		);

		this.addSql(
			`alter table "courses" alter column "preceptor_id" drop default;`,
		);
		this.addSql(
			`alter table "courses" alter column "preceptor_id" type uuid using ("preceptor_id"::text::uuid);`,
		);
		this.addSql(
			`alter table "courses" alter column "preceptor_id" set not null;`,
		);
		this.addSql(
			`alter table "courses" alter column "division" type int using ("division"::int);`,
		);

		this.addSql(`alter table "students" drop column "workshop_commission_id";`);

		this.addSql(`alter table "subjects" drop column "kind";`);

		this.addSql(
			`alter table "subjects" alter column "teacher_id" type varchar(255) using ("teacher_id"::varchar(255));`,
		);
		this.addSql(`alter table "subjects" alter column "teacher_id" set not null;`);

		this.addSql(`alter table "schedule_slots" drop column "commission_number";`);
	}
}
