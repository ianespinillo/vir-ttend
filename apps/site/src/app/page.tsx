import { Contact } from '@/components/landing/contact';
import { Faq } from '@/components/landing/faq';
import { Features } from '@/components/landing/features';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { MobileApp } from '@/components/landing/mobile-app';
import { Plans } from '@/components/landing/plans';

export default function HomePage() {
	return (
		<>
			<Hero />
			<Features />
			<HowItWorks />
			<Plans />
			<MobileApp />
			<Faq />
			<Contact />
		</>
	);
}
