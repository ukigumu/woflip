import { Redirect } from 'expo-router';

import { useStoreVersion } from '@/hooks/use-store';
import { getSettings } from '@/lib/store';

/** Guard de arranque: onboarding solo la primera vez. */
export default function Index() {
  useStoreVersion();
  const { onboardingDone } = getSettings();
  return <Redirect href={onboardingDone ? '/(tabs)/semana' : '/onboarding'} />;
}
