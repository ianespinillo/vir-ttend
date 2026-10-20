import { Migration } from '@mikro-orm/migrations';

/** Teacher name for subjects whose teacher has no user account. */
export class Migration20261019120000_subject_teacher_name extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "subjects" add column "teacher_name" varchar(255) null;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`alter table "subjects" drop column "teacher_name";`);
	}
}
