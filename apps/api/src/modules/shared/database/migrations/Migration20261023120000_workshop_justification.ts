import { Migration } from '@mikro-orm/migrations';

/**
 * Justifications of workshop attendance records, 1:1 with
 * "workshop_attendance_records" (unique FK). It is a separate table from
 * "justification" so the daily justification flow is untouched. Deleting a
 * workshop record removes its justification (ON DELETE CASCADE).
 */
export class Migration20261023120000_workshop_justification extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "workshop_justification" ("id" uuid not null, "workshop_attendance_record_id" uuid not null, "reason" text not null, "notes" text null, "created_by" uuid not null, "created_at" timestamptz not null, constraint "workshop_justification_pkey" primary key ("id"));`,
		);
		this.addSql(
			`alter table "workshop_justification" add constraint "workshop_justification_workshop_attendance_record_id_unique" unique ("workshop_attendance_record_id");`,
		);
		this.addSql(
			`alter table "workshop_justification" add constraint "workshop_justification_workshop_attendance_record_id_foreign" foreign key ("workshop_attendance_record_id") references "workshop_attendance_records" ("id") on update cascade on delete cascade;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "workshop_justification" cascade;`);
	}
}
