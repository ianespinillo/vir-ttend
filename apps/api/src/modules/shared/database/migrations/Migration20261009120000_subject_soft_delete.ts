import { Migration } from '@mikro-orm/migrations';

export class Migration20261009120000_subject_soft_delete extends Migration {
	override async up(): Promise<void> {
		this.addSql(`alter table "subjects" add column "deleted_at" timestamptz;`);
	}

	override async down(): Promise<void> {
		this.addSql(`alter table "subjects" drop column "deleted_at";`);
	}
}
