import { Migration } from '@mikro-orm/migrations';

/**
 * Absence alerts are raised at 10, 20 and the absence limit (28) weighted
 * absences instead of percent bands, so an alert stores the weighted count
 * (fractional, 0.25 steps) and the threshold it was raised for.
 *
 * Legacy percent alerts are kept: `absence_percent` becomes nullable and its
 * value is preserved. Their alert type maps to the new threshold (warning 10,
 * critical 20, exceeded 28) and `absence_count` is backfilled with that
 * threshold, a lower bound since the legacy rows never stored a count.
 */
export class Migration20261014140000_attendance_alerts_absence_count extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "attendance_alerts" add column "absence_count" real null, add column "threshold" int null;`,
		);
		this.addSql(
			`update "attendance_alerts" set "threshold" = case "alert_type" when 'warning' then 10 when 'critical' then 20 else 28 end;`,
		);
		this.addSql(`update "attendance_alerts" set "absence_count" = "threshold";`);
		this.addSql(
			`alter table "attendance_alerts" alter column "absence_count" set not null, alter column "threshold" set not null, alter column "absence_percent" drop not null;`,
		);
	}

	override async down(): Promise<void> {
		// Alerts raised after `up()` never had a percent: restore the lower bound of
		// the legacy band of their type so the column can be required again.
		this.addSql(
			`update "attendance_alerts" set "absence_percent" = case "alert_type" when 'warning' then 50 when 'critical' then 75 else 100 end where "absence_percent" is null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" alter column "absence_percent" set not null;`,
		);
		this.addSql(
			`alter table "attendance_alerts" drop column "absence_count", drop column "threshold";`,
		);
	}
}
