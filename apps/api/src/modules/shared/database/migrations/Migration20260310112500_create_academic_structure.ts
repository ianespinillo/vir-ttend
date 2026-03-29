import { Migration } from '@mikro-orm/migrations';

export class Migration20260310112500_create_academic_structure extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "academic_years" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "school_id" varchar(255) not null, "year" int not null, "start_date" timestamptz not null, "end_date" timestamptz not null, "is_active" boolean not null, "non_working_days" jsonb not null, "absence_threshold_percent" int not null, "late_count_abscense_after_minutes" int not null, constraint "academic_years_pkey" primary key ("id"));`,
		);

		this.addSql(
			`create table "courses" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "school_id" uuid not null, "academic_year_id" uuid not null, "preceptor_id" uuid not null, "level" varchar(255) not null, "is_active" boolean not null, "year_number" int not null, "division" int not null, "shift" varchar(255) not null, "academicYearId" uuid not null, constraint "courses_pkey" primary key ("id"));`,
		);

		this.addSql(
			`create table "subjects" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "course_id" varchar(255) not null, "teacher_id" varchar(255) not null, "name" varchar(255) not null, "area" varchar(255) not null, "weekly_hours" int not null, "courseId" uuid not null, constraint "subjects_pkey" primary key ("id"));`,
		);

		this.addSql(
			`create table "schedule_slots" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "subject_id" varchar(255) not null, "course_id" varchar(255) not null, "day_of_week" DAYOFWEEK not null, "start_time" varchar(255) not null, "end_time" varchar(255) not null, "subjectId" uuid not null, constraint "schedule_slots_pkey" primary key ("id"));`,
		);

		this.addSql(
			`alter table "courses" add constraint "courses_academicYearId_foreign" foreign key ("academicYearId") references "academic_years" ("id") on update cascade;`,
		);

		this.addSql(
			`alter table "subjects" add constraint "subjects_courseId_foreign" foreign key ("courseId") references "courses" ("id") on update cascade;`,
		);

		this.addSql(
			`alter table "schedule_slots" add constraint "schedule_slots_subjectId_foreign" foreign key ("subjectId") references "subjects" ("id") on update cascade;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "courses" drop constraint "courses_academicYearId_foreign";`,
		);

		this.addSql(
			`alter table "subjects" drop constraint "subjects_courseId_foreign";`,
		);

		this.addSql(
			`alter table "schedule_slots" drop constraint "schedule_slots_subjectId_foreign";`,
		);

		this.addSql(`drop table if exists "academic_years" cascade;`);

		this.addSql(`drop table if exists "courses" cascade;`);

		this.addSql(`drop table if exists "subjects" cascade;`);

		this.addSql(`drop table if exists "schedule_slots" cascade;`);
	}
}
