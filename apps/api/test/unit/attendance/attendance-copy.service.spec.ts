import { MockProxy, mock } from 'jest-mock-extended';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { AttendanceCopyService } from '../../../src/modules/attendance/domain/services/attendance-copy.service';

describe('AttendanceCopyService', () => {
	let service: AttendanceCopyService;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		service = new AttendanceCopyService(attendanceRepo);
	});

	it('debe retornar un array vacío si no hay clases anteriores', async () => {
		attendanceRepo.findRecordsOfLastSubjectClass.mockResolvedValue([]);

		const result = await service.getLastClassRecords('subject-1', new Date());

		expect(result).toEqual([]);
		expect(attendanceRepo.findRecordsOfLastSubjectClass).toHaveBeenCalledTimes(1);
	});

	it('debe retornar los registros si existe una clase anterior', async () => {
		const mockRecords = [mock<AttendanceRecord>(), mock<AttendanceRecord>()];
		attendanceRepo.findRecordsOfLastSubjectClass.mockResolvedValue(mockRecords);

		const result = await service.getLastClassRecords('subject-1', new Date());

		expect(result).toEqual(mockRecords);
	});
});
