import { Redirect } from 'expo-router';
import { useSession } from '@/session/SessionProvider';

const routeForStep = {
  profile: '/profile',
  tasks: '/tasks',
  home: '/home',
} as const;

/** Entry point and fallback for every guard change: sends the user to where they belong. */
export default function Index() {
  const { account } = useSession();
  if (!account) return <Redirect href="/login" />;
  return <Redirect href={routeForStep[account.user.onboardingStep]} />;
}
