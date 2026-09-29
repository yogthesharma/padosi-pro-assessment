import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type EmailNotVerifiedDetails } from '@padosipro/shared';
import { useMutation } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage, isApiError } from '@/api/client';
import { api } from '@/api/endpoints';
import { Banner } from '@/components/Banner';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { FadeIn } from '@/components/FadeIn';
import { FormTextField } from '@/components/FormTextField';
import { Screen } from '@/components/Screen';
import { TextLink } from '@/components/TextLink';
import { getApiUrl } from '@/config/api-url';
import { applyServerFieldErrors } from '@/lib/form-errors';
import { useSession } from '@/session/SessionProvider';
import { colors, radius, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [banner, setBanner] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState(getApiUrl());
  useFocusEffect(useCallback(() => setServerUrl(getApiUrl()), []));
  const { control, handleSubmit, setError } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const login = useMutation({ mutationFn: (values: { email: string; password: string }) => api.login(values.email, values.password) });

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    try {
      await signIn(await login.mutateAsync(values));
    } catch (error) {
      if (isApiError(error) && error.code === 'EMAIL_NOT_VERIFIED') {
        const details = error.details as unknown as EmailNotVerifiedDetails;
        router.push({
          pathname: '/verify',
          params: { email: details.email, resendIn: String(details.resendAvailableInSeconds), from: 'login' },
        });
        return;
      }
      if (!applyServerFieldErrors(error, setError, ['email', 'password'])) setBanner(errorMessage(error));
    }
  });

  return (
    <Screen footer={<Button title="Log in" icon="log-in" onPress={() => void onSubmit()} loading={login.isPending} />}>
      <BrandHeader title="Welcome back" subtitle="A calmer way to get things handled. Log in to continue." />

      {banner ? (
        <FadeIn>
          <Banner message={banner} />
        </FadeIn>
      ) : null}

      <FadeIn delay={80}>
        <FormTextField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <FormTextField
          control={control}
          name="password"
          label="Password"
          placeholder="Your password"
          secureToggle
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />
      </FadeIn>

      <FadeIn delay={140}>
        <TextLink prompt="New to PadosiPro?" action="Create an account" onPress={() => router.push('/register')} />
      </FadeIn>

      <FadeIn delay={200} style={styles.serverCard}>
        <View style={styles.serverRow}>
          <View style={styles.serverIcon}>
            <Feather name="server" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serverLabel}>API server</Text>
            <Text style={styles.serverText} numberOfLines={1}>
              {serverUrl}
            </Text>
          </View>
          <TextLink action="Change" onPress={() => router.push('/server')} />
        </View>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  serverCard: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  serverIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverLabel: { ...typography.caption, fontWeight: '600' },
  serverText: { ...typography.caption, color: colors.textSubtle },
});
