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
import { OtpInput } from '@/components/OtpInput';
import { Screen } from '@/components/Screen';
import { TextLink } from '@/components/TextLink';
import { formatSeconds, useCountdown } from '@/hooks/useCountdown';
import { useSession } from '@/session/SessionProvider';
import { colors, spacing, typography } from '@/theme';

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
    <Screen>
      <BrandHeader title="Verify your email" subtitle={`Enter the ${OTP_LENGTH}-digit code we sent to`} />
      <Text style={styles.email} numberOfLines={1}>
        {email}
      </Text>

      {notice ? <Banner tone="info" message={notice} /> : null}
      {error ? (
        <Banner
          tone={needsNewCode ? 'warning' : 'error'}
          message={error.message}
          action={
            alreadyVerified ? <TextLink action="Go to log in" onPress={() => router.replace('/login')} /> : undefined
          }
        />
      ) : null}

      <OtpInput value={code} onChange={setCode} error={!!error && !needsNewCode} disabled={verify.isPending} />

      <Button
        title="Verify email"
        onPress={() => void submit()}
        loading={verify.isPending}
        disabled={code.length !== OTP_LENGTH}
        style={styles.submit}
      />

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
  email: { ...typography.body, fontWeight: '700', marginTop: -spacing.lg, marginBottom: spacing.xl },
  submit: { marginTop: spacing.xl },
  resend: { marginTop: spacing.lg, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  countdown: { ...typography.caption, color: colors.textSubtle, textAlign: 'center' },
  hint: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg },
});
