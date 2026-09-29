import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileInput } from '@padosipro/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { errorMessage } from '@/api/client';
import { api } from '@/api/endpoints';
import { Banner } from '@/components/Banner';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { FormTextField } from '@/components/FormTextField';
import { Screen } from '@/components/Screen';
import { applyServerFieldErrors } from '@/lib/form-errors';
import { useSession } from '@/session/SessionProvider';
import { spacing } from '@/theme';

const FIELDS = ['name', 'mobile', 'address', 'businessName'] as const;

/** Shown once, straight after the first login; the server's onboarding step decides when it's done. */
export default function ProfileScreen() {
  const { account, setAccount, signOut } = useSession();
  const [banner, setBanner] = useState<string | null>(null);
  const existing = account?.profile;

  const { control, handleSubmit, setError } = useForm({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: existing?.name ?? '',
      mobile: existing?.mobile.replace(/^\+91/, '') ?? '',
      address: existing?.address ?? '',
      businessName: existing?.businessName ?? '',
    },
  });

  const save = useMutation({ mutationFn: (values: ProfileInput) => api.saveProfile(values) });

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    try {
      setAccount(await save.mutateAsync(values));
    } catch (error) {
      if (!applyServerFieldErrors(error, setError, FIELDS)) setBanner(errorMessage(error));
    }
  });

  return (
    <Screen
      footer={<Button title="Save and continue" onPress={() => void onSubmit()} loading={save.isPending} />}
    >
      <BrandHeader
        title="Tell us a little more"
        subtitle="So your Lifestyle Manager can coordinate visits and deliveries smoothly."
      />

      {banner ? <Banner message={banner} /> : null}

      <FormTextField
        control={control}
        name="name"
        label="Full name"
        placeholder="e.g. Asha Rao"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <FormTextField
        control={control}
        name="mobile"
        label="Mobile number"
        placeholder="98765 43210"
        prefix="+91"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={16}
        hint="10-digit Indian mobile number"
      />
      <FormTextField
        control={control}
        name="address"
        label="Address"
        placeholder="Flat / house no., street, area, city, PIN"
        multiline
        autoComplete="street-address"
        textContentType="fullStreetAddress"
      />
      <FormTextField
        control={control}
        name="businessName"
        label="Business name"
        optional
        placeholder="Only if you run a business"
        autoCapitalize="words"
        hint="Leave blank if this is for your household."
      />

      <Button title="Log out" variant="ghost" icon="log-out" onPress={() => void signOut()} style={styles.logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logout: { marginTop: spacing.sm, alignSelf: 'center' },
});
