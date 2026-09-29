import { Feather } from '@expo/vector-icons';
import { OTP_LENGTH } from '@padosipro/shared';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage, isApiError, type ApiError } from '@/api/client';
import { api } from '@/api/endpoints';
import { Banner } from '@/components/Banner';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { FadeIn } from '@/components/FadeIn';
import { IconButton } from '@/components/IconButton';
import { OtpInput } from '@/components/OtpInput';
import { Screen } from '@/components/Screen';
import { TextLink } from '@/components/TextLink';
import { formatSeconds, useCountdown } from '@/hooks/useCountdown';
import { useSession } from '@/session/SessionProvider';
import { colors, radius, spacing, typography } from '@/theme';

/** Codes that mean "this code can't work any more; get a new one". */
const NEEDS_NEW_CODE = new Set(['OTP_EXPIRED', 'OTP_NOT_FOUND', 'OTP_TOO_MANY_ATTEMPTS']);

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email: string; resendIn?: string; from?: string }>();
  const email = params.email ?? '';
  const { signIn } = useSession();
  const { remaining, restart } = useCountdown(Number(params.resendIn ?? 30) || 0);

  const [code, setCode] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<string | null>(
    params.from === 'login' ? 'Your email isn’t verified yet. Enter the code we sent to finish signing up.' : null,
  );

  const verify = useMutation({ mutationFn: (value: string) => api.verifyEmail(email, value) });
  const resend = useMutation({ mutationFn: () => api.resendCode(email) });

  const submit = async (value = code) => {
    if (value.length !== OTP_LENGTH || verify.isPending) return;
    setError(null);
    setNotice(null);
    try {
      await signIn(await verify.mutateAsync(value));
    } catch (caught) {
      setCode('');
      setError(isApiError(caught) ? caught : null);
      if (!isApiError(caught)) setNotice(errorMessage(caught));
    }
  };

  // Submit as soon as the sixth digit is typed or pasted.
  useEffect(() => {
    if (code.length === OTP_LENGTH) void submit(code);
  }, [code]);

  const onResend = async () => {
    setError(null);
    setNotice(null);
    try {
      const result = await resend.mutateAsync();
      restart(result.resendAvailableInSeconds);
      setCode('');
      setNotice(`We’ve sent a new code to ${email}.`);
    } catch (caught) {
      if (isApiError(caught) && typeof caught.details.retryAfterSeconds === 'number') {
        restart(caught.details.retryAfterSeconds);
      }
      setError(isApiError(caught) ? caught : null);
    }
  };

  const needsNewCode = error ? NEEDS_NEW_CODE.has(error.code) : false;
  const alreadyVerified = error?.code === 'EMAIL_ALREADY_VERIFIED';

  return (
    <Screen
      footer={
        <Button
          title="Verify email"
          icon="shield"
          onPress={() => void submit()}
          loading={verify.isPending}
          disabled={code.length !== OTP_LENGTH}
        />
      }
    >
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          label="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/register'))}
        />
      </View>

      <BrandHeader title="Verify your email" subtitle={`Enter the ${OTP_LENGTH}-digit code we sent to`} />

      <FadeIn delay={40}>
        <View style={styles.emailChip}>
          <Feather name="mail" size={14} color={colors.primary} />
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
        </View>
      </FadeIn>

      {notice ? (
        <FadeIn>
          <Banner tone="info" message={notice} />
        </FadeIn>
      ) : null}
      {error ? (
        <FadeIn>
          <Banner
            tone={needsNewCode ? 'warning' : 'error'}
            message={error.message}
            action={
              alreadyVerified ? <TextLink action="Go to log in" onPress={() => router.replace('/login')} /> : undefined
            }
          />
        </FadeIn>
      ) : null}

      <FadeIn delay={80}>
        <OtpInput value={code} onChange={setCode} error={!!error && !needsNewCode} disabled={verify.isPending} />
      </FadeIn>

      <FadeIn delay={120}>
        <View style={styles.resend}>
          {remaining > 0 ? (
            <Text style={styles.countdown} accessibilityLiveRegion="polite">
              Didn’t get it? You can resend the code in {formatSeconds(remaining)}
            </Text>
          ) : (
            <Button
              title={needsNewCode ? 'Send a new code' : 'Resend code'}
              variant={needsNewCode ? 'primary' : 'ghost'}
              icon="refresh-cw"
              onPress={() => void onResend()}
              loading={resend.isPending}
            />
          )}
        </View>
      </FadeIn>

      <Text style={styles.hint}>
        The code is valid for 10 minutes. Check your spam folder too. Running locally? Emails land in Mailpit at
        http://localhost:8025.
      </Text>

      <TextLink
        prompt="Wrong email?"
        action="Start again"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/register'))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { marginBottom: spacing.sm },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: -spacing.md,
    marginBottom: spacing.xl,
    maxWidth: '100%',
  },
  email: { ...typography.body, fontWeight: '700', color: colors.primary, flexShrink: 1 },
  resend: { marginTop: spacing.lg, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  countdown: { ...typography.caption, color: colors.textSubtle, textAlign: 'center' },
  hint: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg },
});
