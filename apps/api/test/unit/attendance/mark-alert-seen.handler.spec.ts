import { NotFoundException } from '@nestjs/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { MarkAlertSeenCommand } from '../../../src/modules/attendance/application/commands/mark-alert-seen/mark-alert-seen.command';
import { MarkAlertSeenHandler } from '../../../src/modules/attendance/application/commands/mark-alert-seen/mark-alert-seen.handler';
import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import { IAttendanceAlertRepository } from '../../../src/modules/attendance/domain/repositories/attendance-alert.repository.interface';

describe('MarkAlertSeenHandler', () => {
	let handler: MarkAlertSeenHandler;
	let alertRepo: MockProxy<IAttendanceAlertRepository>;

	beforeEach(() => {
		alertRepo = mock<IAttendanceAlertRepository>();
		handler = new MarkAlertSeenHandler(alertRepo);
	});

	const cmd = new MarkAlertSeenCommand('alert-1', 'user-1');

	it('lanza NotFoundException si no encuentra la alerta', async () => {
		alertRepo.findById.mockResolvedValue(null);
		await expect(handler.execute(cmd)).rejects.toThrow(NotFoundException);
	});

	it('marca la alerta como vista cuando no ha sido vista', async () => {
		const alert = mock<AttendanceAlert>();
		(alert.seenAt as unknown) = undefined;
		(alert.seenBy as unknown) = undefined;
		alertRepo.findById.mockResolvedValue(alert);
		await handler.execute(cmd);
		expect(alert.markAsSeen).toHaveBeenCalledWith('user-1');
		expect(alertRepo.save).toHaveBeenCalledWith(alert);
	});

	it('es idempotente: ejecutar dos veces no lanza error y save no se llama en la segunda ejecución', async () => {
		const alert1 = mock<AttendanceAlert>();
		(alert1.seenAt as unknown) = undefined;
		(alert1.seenBy as unknown) = undefined;
		alertRepo.findById.mockResolvedValueOnce(alert1);

		await handler.execute(cmd);
		expect(alert1.markAsSeen).toHaveBeenCalledWith('user-1');
		expect(alertRepo.save).toHaveBeenCalledTimes(1);

		const alert2 = mock<AttendanceAlert>();
		(alert2.seenAt as unknown) = new Date();
		(alert2.seenBy as unknown) = 'user-1';
		alertRepo.findById.mockResolvedValueOnce(alert2);

		await handler.execute(cmd);
		expect(alert2.markAsSeen).not.toHaveBeenCalled();
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
	});

	it('es idempotente cuando solo seenAt está seteado: no marca ni guarda de nuevo', async () => {
		const alert = mock<AttendanceAlert>();
		(alert.seenAt as unknown) = new Date();
		(alert.seenBy as unknown) = undefined;
		alertRepo.findById.mockResolvedValue(alert);

		await handler.execute(cmd);

		expect(alert.markAsSeen).not.toHaveBeenCalled();
		expect(alertRepo.save).not.toHaveBeenCalled();
	});

	it('es idempotente cuando solo seenBy está seteado: no marca ni guarda de nuevo', async () => {
		const alert = mock<AttendanceAlert>();
		(alert.seenAt as unknown) = undefined;
		(alert.seenBy as unknown) = 'user-1';
		alertRepo.findById.mockResolvedValue(alert);

		await handler.execute(cmd);

		expect(alert.markAsSeen).not.toHaveBeenCalled();
		expect(alertRepo.save).not.toHaveBeenCalled();
	});
});
