import QRCode from 'qrcode';

/**
 * Renders `text` as an SVG QR code string. Runs on the server at build time.
 * The SVG has a `viewBox` and no fixed size, so the caller sizes it with CSS.
 */
export function renderQrSvg(text: string): Promise<string> {
	return QRCode.toString(text, {
		type: 'svg',
		margin: 1,
		errorCorrectionLevel: 'M',
	});
}
