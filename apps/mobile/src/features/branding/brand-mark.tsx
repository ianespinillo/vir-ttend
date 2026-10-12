import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useBrand } from './brand-context';

type BrandMarkSize = 'sm' | 'lg';

// Pixel sizes: the Vir-ttend mark ships as @1x/@2x/@3x PNG next to the file.
const DIMENSIONS: Record<BrandMarkSize, { box: number; seal: number }> = {
	sm: { box: 28, seal: 14 },
	lg: { box: 64, seal: 26 },
};

const SEAL = require('../../../assets/brand/virttend-mark.png');

/**
 * Brand logo. Vir-ttend instances show the Vir-ttend mark; single-school
 * instances show the school crest with the Vir-ttend seal in the corner. A
 * missing or broken crest falls back to the seal alone.
 */
export const BrandMark: React.FC<{ size?: BrandMarkSize }> = ({
	size = 'lg',
}) => {
	const { branding, assetUrl } = useBrand();
	const [crestFailed, setCrestFailed] = useState(false);
	const { box, seal } = DIMENSIONS[size];

	const crestUrl =
		branding.source === 'instance'
			? assetUrl(branding.assets.crestSmallPng)
			: null;

	if (!crestUrl || crestFailed) {
		return (
			<Image
				source={SEAL}
				style={{ width: box, height: box }}
				accessibilityLabel="Vir-ttend"
			/>
		);
	}

	return (
		<View style={{ width: box, height: box }}>
			<Image
				source={{ uri: crestUrl }}
				style={{ width: box, height: box }}
				resizeMode="contain"
				accessibilityLabel={branding.displayName}
				onError={() => setCrestFailed(true)}
			/>
			<View
				style={{
					position: 'absolute',
					right: -seal / 4,
					bottom: -seal / 4,
					width: seal,
					height: seal,
					borderRadius: seal / 2,
					borderWidth: 2,
					borderColor: '#FFFFFF',
					overflow: 'hidden',
					backgroundColor: '#FFFFFF',
				}}
			>
				<Image source={SEAL} style={{ width: seal - 4, height: seal - 4 }} />
			</View>
		</View>
	);
};
