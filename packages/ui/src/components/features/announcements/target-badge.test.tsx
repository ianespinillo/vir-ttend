import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TargetBadge } from './target-badge';

describe('TargetBadge', () => {
	it('school renderiza "Toda la escuela"', () => {
		render(<TargetBadge targetType="school" />);
		expect(screen.getByText('Toda la escuela')).toBeInTheDocument();
	});

	it('course con label renderiza el label', () => {
		render(<TargetBadge targetType="course" targetLabel="1°A" />);
		expect(screen.getByText('1°A')).toBeInTheDocument();
	});

	it('course sin label renderiza "Dirigido"', () => {
		render(<TargetBadge targetType="level" />);
		expect(screen.getByText('Dirigido')).toBeInTheDocument();
	});
});
