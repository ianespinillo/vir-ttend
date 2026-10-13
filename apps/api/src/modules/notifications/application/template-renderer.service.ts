import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable, Optional } from '@nestjs/common';
import Handlebars from 'handlebars';

const DEFAULT_TEMPLATES_DIR = join(
	__dirname,
	'..',
	'infrastructure',
	'templates',
);

@Injectable()
export class TemplateRenderer {
	private readonly templatesDir: string;
	private readonly cache = new Map<string, Handlebars.TemplateDelegate>();

	constructor(
		@Optional()
		@Inject('TEMPLATES_DIR')
		templatesDir?: string,
	) {
		this.templatesDir = templatesDir ?? DEFAULT_TEMPLATES_DIR;
	}

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
