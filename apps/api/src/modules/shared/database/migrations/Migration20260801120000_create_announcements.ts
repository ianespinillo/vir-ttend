import { Migration } from '@mikro-orm/migrations';

export class Migration20260801120000_create_announcements extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "announcements" ("id" uuid not null default gen_random_uuid(), "school_id" uuid not null, "tenant_id" uuid not null, "author_id" uuid not null, "title" varchar(255) not null, "body" text not null, "target_type" varchar(255) not null, "target_id" varchar(255) null, "status" varchar(255) not null, "publish_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), constraint "announcements_pkey" primary key ("id"));`,
		);
		this.addSql(
			`create index if not exists "idx_announcements_school_id_status_publish_at" on "announcements" ("school_id", "status", "publish_at");`,
		);

		this.addSql(
			`create index if not exists "idx_attendance_records_student" on "attendanceRecord" ("student_id");`,
		);
		this.addSql(
			`create index if not exists "idx_attendance_alerts_unseen" on "attendance_alerts" ("seen_at") where "seen_at" is null;`,
		);
		this.addSql(
			`create index if not exists "idx_students_course" on "students" ("course_id") where "status" = 'active';`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "announcements" cascade;`);
		this.addSql(
			`drop index if exists "idx_announcements_school_id_status_publish_at";`,
		);
		this.addSql(`drop index if exists "idx_attendance_records_student";`);
		this.addSql(`drop index if exists "idx_attendance_alerts_unseen";`);
		this.addSql(`drop index if exists "idx_students_course";`);
	}
}
