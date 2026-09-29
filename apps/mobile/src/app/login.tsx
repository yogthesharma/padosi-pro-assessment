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
import { FormTextField } from '@/components/FormTextField';
import { Screen } from '@/components/Screen';
import { TextLink } from '@/components/TextLink';
import { getApiUrl } from '@/config/api-url';
import { applyServerFieldErrors } from '@/lib/form-errors';
import { useSession } from '@/session/SessionProvider';
import { spacing, typography } from '@/theme';

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
    <Screen>
      <BrandHeader title="Welcome back" subtitle="A calmer way to get things handled. Log in to continue." />

      {banner ? <Banner message={banner} /> : null}

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

      <Button title="Log in" onPress={() => void onSubmit()} loading={login.isPending} style={styles.submit} />
      <TextLink prompt="New to PadosiPro?" action="Create an account" onPress={() => router.push('/register')} />

      <View style={styles.serverRow}>
        <Text style={styles.serverText} numberOfLines={1}>
          Server: {serverUrl}
        </Text>
        <TextLink action="Change" onPress={() => router.push('/server')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: spacing.sm },
  serverRow: { marginTop: 'auto', paddingTop: spacing.xxl, alignItems: 'center' },
  serverText: { ...typography.caption, marginBottom: -spacing.sm },
});
