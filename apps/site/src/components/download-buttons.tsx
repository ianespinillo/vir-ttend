import type { AppDownloads } from '@/config/mobile-apps';
import { Download, Play, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { PlatformScope } from './platform-scope';

// Store-style buttons built from text and generic icons. Before launch, swap
// them for the official badges from Google Play and App Store marketing assets.
const storeButton =
	'inline-flex min-w-48 items-center gap-3 rounded-lg bg-neutral-950 px-4 py-2.5 text-left text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const secondaryButton =
	'inline-flex min-w-48 items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const disabledButton =
	'inline-flex min-w-48 cursor-not-allowed items-center gap-3 rounded-lg border border-dashed border-input bg-muted px-4 py-2.5 text-left text-muted-foreground';

function StoreLink({
	href,
	icon,
	eyebrow,
	label,
}: {
	href: string;
	icon: ReactNode;
	eyebrow: string;
	label: string;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={storeButton}
		>
			{icon}
			<span className="flex flex-col leading-tight">
				<span className="text-[11px] opacity-80">{eyebrow}</span>
				<span className="text-base font-semibold">{label}</span>
			</span>
		</a>
	);
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={secondaryButton}
		>
			<Download className="h-4 w-4" aria-hidden="true" />
			{label}
		</a>
	);
}

function ComingSoon({ label }: { label: string }) {
	return (
		<span aria-disabled="true" className={disabledButton}>
			<Smartphone className="h-6 w-6" aria-hidden="true" />
			<span className="flex flex-col leading-tight">
				<span className="text-[11px]">Próximamente</span>
				<span className="text-base font-semibold">{label}</span>
			</span>
		</span>
	);
}

/**
 * Android and iOS download options for one app.
 *
 * Both platforms are rendered on the server, so it works without JS. The
 * `PlatformScope` client wrapper only reorders and dims them on phones: the
 * visitor's platform comes first and the other one is de-emphasized.
 */
export function DownloadButtons({ downloads }: { downloads: AppDownloads }) {
	const { android, ios } = downloads;
	const androidAvailable = Boolean(android.playStoreUrl || android.apkUrl);
	const iosAvailable = Boolean(ios.appStoreUrl || ios.testFlightUrl);

	return (
		<PlatformScope className="flex flex-col flex-wrap gap-6 sm:flex-row">
			<div className="flex flex-col gap-2 transition-opacity group-data-[platform=ios]/platform:order-last group-data-[platform=ios]/platform:opacity-60">
				<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Android
				</span>
				{android.playStoreUrl ? (
					<StoreLink
						href={android.playStoreUrl}
						icon={<Play className="h-6 w-6" aria-hidden="true" />}
						eyebrow="Disponible en"
						label="Google Play"
					/>
				) : null}
				{android.apkUrl ? (
					<SecondaryLink href={android.apkUrl} label="APK para Android" />
				) : null}
				{androidAvailable ? null : <ComingSoon label="Google Play" />}
			</div>

			<div className="flex flex-col gap-2 transition-opacity group-data-[platform=android]/platform:order-last group-data-[platform=android]/platform:opacity-60">
				<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					iPhone y iPad
				</span>
				{ios.appStoreUrl ? (
					<StoreLink
						href={ios.appStoreUrl}
						icon={<Smartphone className="h-6 w-6" aria-hidden="true" />}
						eyebrow="Descargar en"
						label="App Store"
					/>
				) : null}
				{ios.testFlightUrl ? (
					<SecondaryLink href={ios.testFlightUrl} label="Beta en TestFlight" />
				) : null}
				{iosAvailable ? null : <ComingSoon label="App Store" />}
			</div>
		</PlatformScope>
	);
}
