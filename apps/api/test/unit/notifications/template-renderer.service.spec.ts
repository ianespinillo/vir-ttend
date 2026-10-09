import { TemplateRenderer } from '../../../src/modules/notifications/application/template-renderer.service';

describe('TemplateRenderer', () => {
	const renderer = new TemplateRenderer();

	it('renders user-created with names, email and temporary password', () => {
		const html = renderer.render('user-created', {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@test.com',
			rawPassword: 'Abc12345',
		});

		expect(html).toContain('John');
		expect(html).toContain('Doe');
		expect(html).toContain('john@test.com');
		expect(html).toContain('Abc12345');
	});

	it('renders user-tenant-linked with tenant name and role', () => {
		const html = renderer.render('user-tenant-linked', {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@test.com',
			tenantName: 'Colegio Nacional',
			role: 'preceptor',
		});

		expect(html).toContain('John');
		expect(html).toContain('Doe');
		expect(html).toContain('Colegio Nacional');
		expect(html).toContain('preceptor');
		expect(html).toContain('john@test.com');
	});
});
