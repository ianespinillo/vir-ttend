import { ExcelRow } from '../types/excel-row.type';

export interface IExcelGeneratorService {
	generate(rows: ExcelRow[], title: string): Promise<Buffer>;
}
