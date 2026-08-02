import { PdfMetadata } from '../types/pdf-metadata.type';
import { PdfSection } from '../types/pdf-section.type';

export interface IPdfGeneratorService {
	generate(sections: PdfSection[], metadata: PdfMetadata): Promise<Buffer>;
}
