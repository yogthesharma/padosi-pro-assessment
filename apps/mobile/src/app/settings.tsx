import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FadeIn } from '@/components/FadeIn';
import { IconButton } from '@/components/IconButton';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { getApiUrl } from '@/config/api-url';
import { useSession } from '@/session/SessionProvider';
import { colors, spacing, typography } from '@/theme';

/** Account & app controls live here — keeps Home focused on tasks. */
export default function SettingsScreen() {
  const { account, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <Screen>
      <FadeIn>
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />
          <Text style={styles.screenTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <Text style={styles.sectionLabel}>Account</Text>
        <ListRow
          icon="user"
          title={account?.profile?.name ?? 'Your profile'}
          subtitle={account?.user.email}
        />
        <ListRow
          icon="map-pin"
          title="Home address"
          subtitle={account?.profile?.address ?? 'Not set yet'}
        />
        {account?.profile?.mobile ? (
          <ListRow icon="phone" title="Mobile" subtitle={account.profile.mobile} />
        ) : null}
      </FadeIn>

      <FadeIn delay={120}>
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Tasks</Text>
        <ListRow
          icon="edit-2"
          title="Edit selected tasks"
          subtitle={`${account?.user.selectedTaskCount ?? 0} selected`}
          onPress={() => router.push('/tasks')}
        />
      </FadeIn>

      <FadeIn delay={180}>
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>App</Text>
        <ListRow
          icon="server"
          title="Server"
          subtitle={getApiUrl()}
          onPress={() => router.push('/server')}
        />
        <ListRow
          icon="log-out"
          title={signingOut ? 'Signing out…' : 'Sign out'}
          subtitle="You'll need to log in again"
          tone="danger"
          onPress={() => void onSignOut()}
        />
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  screenTitle: { ...typography.heading },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
