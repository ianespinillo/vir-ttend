import React from 'react';
import { Image, Text, View } from 'react-native';

const SEAL = require('../../../assets/brand/virttend-mark.png');

/** Fixed "con vir-ttend" seal shown on single-school instances. */
export const PoweredBy: React.FC = () => (
	<View className="flex-row items-center justify-center">
		<Image source={SEAL} style={{ width: 14, height: 14 }} />
		<Text className="ml-1.5 text-xs text-slate-500">con vir-ttend</Text>
	</View>
);
