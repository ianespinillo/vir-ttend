import { Migration } from '@mikro-orm/migrations';

/**
 * Workshop commissions (technical schools): each course is split into two
 * commissions that attend the workshop (taller) in the opposite shift.
 *
 * - subjects.kind: 'theory' (default) | 'workshop'.
 * - workshop_commissions: up to two rows per course (number 1 | 2).
 * - students.workshop_commission_id: single membership; cleared if the
 *   commission is deleted (ON DELETE SET NULL).
 * - schedule_slots.commission_number: 1 | 2, NULL = both commissions.
 */
export class Migration20261014120000_workshop_commissions extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "subjects" add column "kind" varchar(255) not null default 'theory';`,
		);

		this.addSql(
			`create table "workshop_commissions" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "tenant_id" varchar(255) not null, "course_id" uuid not null, "number" smallint not null, "preceptor_id" uuid null, constraint "workshop_commissions_pkey" primary key ("id"), constraint "workshop_commissions_number_check" check ("number" in (1, 2)));`,
		);
		this.addSql(
			`alter table "workshop_commissions" add constraint "workshop_commissions_course_id_number_unique" unique ("course_id", "number");`,
		);
		this.addSql(
			`alter table "workshop_commissions" add constraint "workshop_commissions_course_id_foreign" foreign key ("course_id") references "courses" ("id") on update cascade on delete cascade;`,
		);

		this.addSql(
			`alter table "students" add column "workshop_commission_id" uuid null;`,
		);
		this.addSql(
			`alter table "students" add constraint "students_workshop_commission_id_foreign" foreign key ("workshop_commission_id") references "workshop_commissions" ("id") on update cascade on delete set null;`,
		);
		this.addSql(
			`create index "students_workshop_commission_id_index" on "students" ("workshop_commission_id");`,
		);

		this.addSql(
			`alter table "schedule_slots" add column "commission_number" smallint null;`,
		);
		this.addSql(
			`alter table "schedule_slots" add constraint "schedule_slots_commission_number_check" check ("commission_number" is null or "commission_number" in (1, 2));`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "schedule_slots" drop constraint "schedule_slots_commission_number_check";`,
		);
		this.addSql(`alter table "schedule_slots" drop column "commission_number";`);

		this.addSql(`drop index "students_workshop_commission_id_index";`);
		this.addSql(
			`alter table "students" drop constraint "students_workshop_commission_id_foreign";`,
		);
		this.addSql(`alter table "students" drop column "workshop_commission_id";`);

		this.addSql(`drop table if exists "workshop_commissions" cascade;`);

		this.addSql(`alter table "subjects" drop column "kind";`);
	}
}
