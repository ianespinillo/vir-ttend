import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';

const DEFAULT_TEMPLATES_DIR = join(
	__dirname,
	'..',
	'infrastructure',
	'templates',
);

@Injectable()
export class TemplateRenderer {
	private readonly cache = new Map<string, Handlebars.TemplateDelegate>();

	constructor(private readonly templatesDir: string = DEFAULT_TEMPLATES_DIR) {}

	render(template: string, context: Record<string, unknown>): string {
		let compiled = this.cache.get(template);
		if (!compiled) {
			const source = readFileSync(
				join(this.templatesDir, `${template}.hbs`),
				'utf8',
			);
			compiled = Handlebars.compile(source);
			this.cache.set(template, compiled);
		}
		return compiled(context);
	}
}
