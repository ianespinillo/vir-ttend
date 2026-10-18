import { DAYOFWEEK, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { SetScheduleCommand } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.command';
import { SetScheduleHandler } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.handler';
import { GetScheduleHandler } from '../../../../src/modules/academic/application/queries/get-schedule/get-schedule.handler';
import { GetScheduleQuery } from '../../../../src/modules/academic/application/queries/get-schedule/get-schedule.query';
import { ScheduleController } from '../../../../src/modules/academic/presentation/controllers/schedule-slot.controller';

describe('ScheduleController', () => {
	let controller: ScheduleController;
	let setScheduleHandler: MockProxy<SetScheduleHandler>;
	let getScheduleHandler: MockProxy<GetScheduleHandler>;

	beforeEach(() => {
		setScheduleHandler = mock<SetScheduleHandler>();
		getScheduleHandler = mock<GetScheduleHandler>();
		controller = new ScheduleController(setScheduleHandler, getScheduleHandler);
	});

	it('decorates get and set with appropriate roles allowing preceptors to manage schedules', () => {
		const getRoles = Reflect.getMetadata(
			'roles',
			ScheduleController.prototype.get,
		);
		const setRoles = Reflect.getMetadata(
			'roles',
			ScheduleController.prototype.set,
		);

		expect(getRoles).toEqual([ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER]);
		expect(setRoles).toEqual([ROLES.ADMIN, ROLES.PRECEPTOR]);
	});

	it('delegates get to GetScheduleHandler with courseId', async () => {
		await controller.get('course-1');

		expect(getScheduleHandler.execute).toHaveBeenCalledWith(
			new GetScheduleQuery('course-1'),
		);
	});

	it('delegates set to SetScheduleHandler with command', async () => {
		const dto = {
			courseId: 'course-1',
			subjectId: 'sub-1',
			slots: [
				{
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '08:00',
					endTime: '09:00',
				},
			],
		};
		await controller.set(dto);

		expect(setScheduleHandler.execute).toHaveBeenCalledWith(
			new SetScheduleCommand(dto.subjectId, dto.slots, dto.courseId),
		);
	});
});
