import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage, isApiError } from '@/api/client';
import { api } from '@/api/endpoints';
import { Banner } from '@/components/Banner';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { FadeIn } from '@/components/FadeIn';
import { FormTextField } from '@/components/FormTextField';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { TextLink } from '@/components/TextLink';
import { passwordRules, registerFormSchema } from '@/features/auth/schemas';
import { applyServerFieldErrors } from '@/lib/form-errors';
import { colors, radius, spacing, typography } from '@/theme';

export default function RegisterScreen() {
  const [banner, setBanner] = useState<string | null>(null);
  const { control, handleSubmit, setError } = useForm({
    resolver: zodResolver(registerFormSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' }) ?? '';

  const register = useMutation({
    mutationFn: (values: { email: string; password: string }) => api.register(values.email, values.password),
  });

  const onSubmit = handleSubmit(async ({ email, password: chosenPassword }) => {
    setBanner(null);
    try {
      const result = await register.mutateAsync({ email, password: chosenPassword });
      router.push({ pathname: '/verify', params: { email: result.email, resendIn: String(result.resendAvailableInSeconds) } });
    } catch (error) {
      if (isApiError(error) && error.code === 'EMAIL_ALREADY_REGISTERED') {
        setError('email', { type: 'server', message: 'This email is already registered. Log in instead.' });
        return;
      }
      if (!applyServerFieldErrors(error, setError, ['email', 'password'])) setBanner(errorMessage(error));
    }
  });

  return (
    <Screen
      footer={<Button title="Create account" icon="arrow-right" onPress={() => void onSubmit()} loading={register.isPending} />}
    >
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          label="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
        />
      </View>

      <BrandHeader
        title="Create your account"
        subtitle="Tell us what your household needs and your Lifestyle Manager gets it done."
      />

      {banner ? <Banner message={banner} /> : null}

      <FadeIn delay={60}>
        <FormTextField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <FormTextField
          control={control}
          name="password"
          label="Password"
          placeholder="Create a password"
          secureToggle
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <View style={styles.rules} accessibilityLabel="Password requirements">
          {passwordRules.map((rule) => {
            const met = rule.test(password);
            return (
              <View key={rule.label} style={[styles.rule, met && styles.ruleOn]}>
                <Feather name={met ? 'check' : 'circle'} size={12} color={met ? colors.success : colors.textMuted} />
                <Text style={[styles.ruleText, met && styles.ruleMet]}>{rule.label}</Text>
              </View>
            );
          })}
        </View>
        <FormTextField
          control={control}
          name="confirmPassword"
          label="Confirm password"
          placeholder="Type it again"
          secureToggle
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />
      </FadeIn>

      <TextLink
        prompt="Already have an account?"
        action="Log in"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { marginBottom: spacing.sm },
  rules: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.lg },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  ruleOn: { backgroundColor: colors.successMuted },
  ruleText: typography.caption,
  ruleMet: { color: colors.success, fontWeight: '600' },
});
