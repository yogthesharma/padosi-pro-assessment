import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { SelectedTask } from '@padosipro/shared';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/client';
import { api, queryKeys } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { FadeIn } from '@/components/FadeIn';
import { IconButton } from '@/components/IconButton';
import { PressableScale } from '@/components/PressableScale';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { featherIcon } from '@/lib/icons';
import { useSession } from '@/session/SessionProvider';
import { colors, radius, shadow, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { account } = useSession();
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

  let body;
  if (tasks.isPending) {
    body = <LoadingView message="Loading your tasks…" />;
  } else if (tasks.error) {
    body = <ErrorView message={errorMessage(tasks.error)} onRetry={() => void tasks.refetch()} />;
  } else if (groups.length === 0) {
    body = (
      <EmptyView
        icon="clipboard"
        title="No tasks yet"
        message="Pick what you'd like your Lifestyle Manager to handle."
        action={<Button title="Choose tasks" icon="plus" onPress={() => router.push('/tasks')} />}
      />
    );
  } else {
    body = (
      <FadeIn delay={80}>
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionTitle}>Your tasks</Text>
            <Text style={styles.sectionMeta}>{tasks.data?.tasks.length} selected</Text>
          </View>
        </View>
        {groups.map(([categoryId, group], index) => (
          <FadeIn key={categoryId} delay={100 + index * 50}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <Feather name={featherIcon(group.icon)} size={16} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>{group.name}</Text>
              </View>
              {group.tasks.map((task, taskIndex) => (
                <View key={task.id} style={[styles.taskRow, taskIndex > 0 && styles.taskDivider]}>
                  <Feather name="check-circle" size={18} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeIn>
        ))}
      </FadeIn>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={tasks.isRefetching} onRefresh={() => void tasks.refetch()} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <LinearGradient colors={[colors.primary, colors.heroWash]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.brandChip}>
                <Text style={styles.brandChipText}>PadosiPro</Text>
              </View>
              <IconButton icon="settings" label="Settings" tone="onPrimary" onPress={() => router.push('/settings')} />
            </View>
            <Text style={styles.greeting}>Hi, {firstName}</Text>
            <Text style={styles.heroText}>Your Lifestyle Manager takes it from here.</Text>
            <View style={styles.heroStat}>
              <Feather name="check-circle" size={16} color={colors.accent} />
              <Text style={styles.heroStatText}>
                {account?.user.selectedTaskCount ?? 0} task{(account?.user.selectedTaskCount ?? 0) === 1 ? '' : 's'} in play
              </Text>
            </View>
          </LinearGradient>
        </FadeIn>

        <View style={styles.bodyArea}>{body}</View>
      </ScrollView>

      {/* Thumb-zone primary action */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
        <View style={styles.footer}>
          <PressableScale
            onPress={() => router.push('/tasks')}
            accessibilityLabel="Edit tasks"
            style={styles.footerButton}
          >
            <Feather name="edit-2" size={18} color={colors.white} />
            <Text style={styles.footerButtonText}>Edit tasks</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 100,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadow.soft,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  brandChip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  brandChipText: { color: colors.accent, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  greeting: { color: colors.white, fontSize: 28, fontWeight: '700', marginBottom: spacing.xs },
  heroText: { color: '#D1E7DF', fontSize: 15, lineHeight: 22, marginBottom: spacing.lg },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroStatText: { color: '#E8F8F3', fontWeight: '600', fontSize: 13 },
  bodyArea: { flexGrow: 1, minHeight: 200 },
  sectionRow: { marginBottom: spacing.md },
  sectionTitle: typography.heading,
  sectionMeta: typography.caption,
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...typography.label, color: colors.primary },
  taskRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  taskDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  taskName: { ...typography.body, fontWeight: '600' },
  taskDescription: typography.caption,
  footerSafe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  footerButton: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.soft,
  },
  footerButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
