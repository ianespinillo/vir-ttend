import { WorkshopSplitService } from '../../../../src/modules/academic/domain/services/workshop-split.service';

const s = (lastName: string, firstName: string) => ({ lastName, firstName });
const names = (list: Array<{ lastName: string; firstName: string }>) =>
	list.map((x) => `${x.lastName} ${x.firstName}`);

describe('WorkshopSplitService', () => {
	it('sorts by last name then first name ignoring case and accents', () => {
		const [first, second] = WorkshopSplitService.split([
			s('pérez', 'Luis'),
			s('Perez', 'Ana'),
			s('Álvarez', 'Zoe'),
			s('zapata', 'Eva'),
		]);
		expect(names(first)).toEqual(['Álvarez Zoe', 'Perez Ana']);
		expect(names(second)).toEqual(['pérez Luis', 'zapata Eva']);
	});

	it('gives the extra student to commission 1 on odd counts (5 -> 3/2)', () => {
		const [first, second] = WorkshopSplitService.split([
			s('E', 'a'),
			s('B', 'a'),
			s('D', 'a'),
			s('A', 'a'),
			s('C', 'a'),
		]);
		expect(names(first)).toEqual(['A a', 'B a', 'C a']);
		expect(names(second)).toEqual(['D a', 'E a']);
	});

	it('handles empty and single-student courses', () => {
		expect(WorkshopSplitService.split([])).toEqual([[], []]);
		const [first, second] = WorkshopSplitService.split([s('A', 'a')]);
		expect(first).toHaveLength(1);
		expect(second).toHaveLength(0);
	});

	it('does not mutate the input', () => {
		const input = [s('B', 'a'), s('A', 'a')];
		WorkshopSplitService.split(input);
		expect(names(input)).toEqual(['B a', 'A a']);
	});
});
