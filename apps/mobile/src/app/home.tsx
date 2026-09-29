import { Feather } from '@expo/vector-icons';
import type { SelectedTask } from '@padosipro/shared';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/client';
import { api, queryKeys } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { featherIcon } from '@/lib/icons';
import { useSession } from '@/session/SessionProvider';
import { colors, radius, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { account, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const tasks = useQuery({ queryKey: queryKeys.selectedTasks, queryFn: api.selectedTasks });

  const firstName = account?.profile?.name.split(' ')[0] ?? 'there';

  const groups = useMemo(() => {
    const byCategory = new Map<string, { name: string; icon: string; tasks: SelectedTask[] }>();
    for (const task of tasks.data?.tasks ?? []) {
      const group = byCategory.get(task.category.id) ?? { name: task.category.name, icon: task.category.icon, tasks: [] };
      group.tasks.push(task);
      byCategory.set(task.category.id, group);
    }
    return [...byCategory.entries()];
  }, [tasks.data]);

  const onSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  let body;
  if (tasks.isPending) {
    body = <LoadingView message="Loading your tasks…" />;
  } else if (tasks.error) {
    body = <ErrorView message={errorMessage(tasks.error)} onRetry={() => void tasks.refetch()} />;
  } else if (groups.length === 0) {
    body = (
      <EmptyView
        icon="clipboard"
        title="No tasks yet."
        message="Pick what you'd like your Lifestyle Manager to handle."
        action={<Button title="Choose tasks" onPress={() => router.push('/tasks')} />}
      />
    );
  } else {
    body = (
      <>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Your tasks · {tasks.data?.tasks.length}</Text>
          <Button title="Edit" icon="edit-2" variant="ghost" onPress={() => router.push('/tasks')} />
        </View>
        {groups.map(([categoryId, group]) => (
          <View key={categoryId} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Feather name={featherIcon(group.icon)} size={16} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{group.name}</Text>
            </View>
            {group.tasks.map((task, index) => (
              <View key={task.id} style={[styles.taskRow, index > 0 && styles.taskDivider]}>
                <Feather name="check-circle" size={18} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={tasks.isRefetching} onRefresh={() => void tasks.refetch()} tintColor={colors.primary} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>PadosiPro</Text>
          <Text style={styles.greeting}>Hi, {firstName}</Text>
          <Text style={styles.heroText}>Your Lifestyle Manager takes it from here. Here's what you asked us to handle.</Text>
        </View>

        <View style={styles.bodyArea}>{body}</View>

        <View style={styles.accountCard}>
          <Text style={styles.signedInLabel}>Signed in as</Text>
          <Text style={styles.signedInEmail}>{account?.user.email}</Text>
          <Button
            title="Sign out"
            icon="log-out"
            variant="danger"
            loading={signingOut}
            onPress={() => void onSignOut()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.xl, width: '100%', maxWidth: 560, alignSelf: 'center' },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg + 4,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  brand: { color: colors.accent, fontWeight: '800', fontSize: 14, letterSpacing: 1, marginBottom: spacing.md },
  greeting: { color: colors.white, fontSize: 26, fontWeight: '700', marginBottom: spacing.xs },
  heroText: { color: '#D1E7DF', fontSize: 15, lineHeight: 22 },
  bodyArea: { flexGrow: 1, minHeight: 240 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: typography.heading,
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...typography.label, color: colors.primary },
  taskRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  taskDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  taskName: { ...typography.body, fontWeight: '600' },
  taskDescription: typography.caption,
  accountCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  signedInLabel: typography.caption,
  signedInEmail: { ...typography.body, fontWeight: '600' },
});
