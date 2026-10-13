import { useContext } from 'react';
import { OutboxContext, type OutboxContextValue } from './outbox-provider';

export const useOutbox = (): OutboxContextValue => {
	const context = useContext(OutboxContext);
	if (!context) {
		throw new Error('useOutbox must be used within an OutboxProvider');
	}
	return context;
};
