import { Redirect } from 'expo-router';
import { nextRoute } from '@/features/onboarding/guard';
import { useApp } from '@/store/app';

export default function Index() {
  const s = useApp();
  return <Redirect href={nextRoute(s)} />;
}
