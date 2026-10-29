import { Migration } from '@mikro-orm/migrations';

/**
 * Markers for a shift that was not held on a date (for example, the teacher
 * did not come): one table for the theory (daily) shift of a course and one
 * for a workshop commission. A marker is a class-level fact, not a per-student
 * status, so the day stays out of the "days given" of the course. Deleting the
 * course or the commission removes its markers (ON DELETE CASCADE).
 */
export class Migration20261029120000_session_not_held extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "daily_session_not_held" ("id" uuid not null, "tenant_id" uuid not null, "course_id" uuid not null, "date" date not null, "reason" text null, "created_by" uuid not null, "created_at" timestamptz not null, constraint "daily_session_not_held_pkey" primary key ("id"));`,
		);
		this.addSql(
			`alter table "daily_session_not_held" add constraint "daily_session_not_held_course_date_unique" unique ("course_id", "date");`,
		);
		this.addSql(
			`alter table "daily_session_not_held" add constraint "daily_session_not_held_course_id_foreign" foreign key ("course_id") references "courses" ("id") on update cascade on delete cascade;`,
		);

		this.addSql(
			`create table "workshop_session_not_held" ("id" uuid not null, "tenant_id" uuid not null, "workshop_commission_id" uuid not null, "date" date not null, "reason" text null, "created_by" uuid not null, "created_at" timestamptz not null, constraint "workshop_session_not_held_pkey" primary key ("id"));`,
		);
		this.addSql(
			`alter table "workshop_session_not_held" add constraint "workshop_session_not_held_commission_date_unique" unique ("workshop_commission_id", "date");`,
		);
		this.addSql(
			`alter table "workshop_session_not_held" add constraint "workshop_session_not_held_workshop_commission_id_foreign" foreign key ("workshop_commission_id") references "workshop_commissions" ("id") on update cascade on delete cascade;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "workshop_session_not_held" cascade;`);
		this.addSql(`drop table if exists "daily_session_not_held" cascade;`);
	}
}
