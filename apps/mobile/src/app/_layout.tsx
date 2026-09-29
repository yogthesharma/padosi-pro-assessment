import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { SessionProvider, useSession } from '@/session/SessionProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // Retrying won't fix a 4xx; only retry network-level failures once.
            retry: (failureCount, error) => failureCount < 1 && isApiError(error) && error.status === 0,
          },
        },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Routes are guarded by session state and the server's onboarding step. When a guard turns
 * false (log in, finish a step, log out) Expo Router drops those screens and falls back to
 * `index`, which redirects to wherever the user belongs now.
 */
function RootNavigator() {
  const { state, account, retry, signOut } = useSession();

  if (state.status === 'loading') {
    return (
      <Screen scroll={false}>
        <LoadingView message="Getting things ready…" />
      </Screen>
    );
  }

  if (state.status === 'offline') {
    return (
      <Screen scroll={false}>
        <ErrorView
          message={state.message}
          onRetry={retry}
          extra={<Button title="Log out" variant="ghost" onPress={() => void signOut()} style={{ marginTop: 8 }} />}
        />
      </Screen>
    );
  }

  const signedIn = account !== null;
  const step = account?.user.onboardingStep;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && step === 'profile'}>
        <Stack.Screen name="profile" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && step === 'home'}>
        <Stack.Screen name="home" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && step !== 'profile'}>
        <Stack.Screen name="tasks" />
      </Stack.Protected>

      <Stack.Screen name="server" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
