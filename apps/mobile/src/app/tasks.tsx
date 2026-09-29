import { Feather } from '@expo/vector-icons';
import type { TaskCategory } from '@padosipro/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { api, queryKeys } from '@/api/endpoints';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { FadeIn } from '@/components/FadeIn';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { ConfirmSheet } from '@/features/tasks/ConfirmSheet';
import { filterCatalogue } from '@/features/tasks/filterCatalogue';
import { SearchBar } from '@/features/tasks/SearchBar';
import { TaskCard } from '@/features/tasks/TaskCard';
import { featherIcon } from '@/lib/icons';
import { useSession } from '@/session/SessionProvider';
import { colors, radius, shadow, spacing, typography } from '@/theme';

/**
 * Used twice: as the last onboarding step, and from Home to edit the selection.
 * The onboarding step from the server tells the two apart.
 */
export default function TasksScreen() {
  const { account, setAccount } = useSession();
  const queryClient = useQueryClient();
  const editing = account?.user.onboardingStep === 'home';

  const catalogue = useQuery({ queryKey: queryKeys.catalogue, queryFn: api.catalogue });
  const current = useQuery({ queryKey: queryKeys.selectedTasks, queryFn: api.selectedTasks, enabled: editing });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finishedOnboarding, setFinishedOnboarding] = useState(false);

  // When editing, start from what the user already picked.
  useEffect(() => {
    if (current.data) setSelected(new Set(current.data.tasks.map((task) => task.id)));
  }, [current.data]);

  // The Home route only unlocks once the session knows onboarding is done.
  useEffect(() => {
    if (finishedOnboarding && account?.user.onboardingStep === 'home') router.replace('/home');
  }, [finishedOnboarding, account?.user.onboardingStep]);

  const toggle = useCallback((taskId: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const save = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const saved = await api.saveTasks(taskIds);
      return { saved, account: await api.me() };
    },
    onSuccess: ({ saved, account: updated }) => {
      queryClient.setQueryData(queryKeys.selectedTasks, saved);
      setConfirming(false);
      if (editing) {
        setAccount(updated);
        if (router.canGoBack()) router.back();
        else router.replace('/home');
      } else {
        setFinishedOnboarding(true);
        setAccount(updated);
      }
    },
    onError: (error) => setSaveError(errorMessage(error)),
  });

  const sections = useMemo(
    () =>
      filterCatalogue(catalogue.data?.categories ?? [], search).map((category) => ({
        category,
        data: category.tasks,
      })),
    [catalogue.data, search],
  );

  const header = (
    <FadeIn>
      {editing ? (
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />
        </View>
      ) : null}
      <BrandHeader
        title={editing ? 'Edit your tasks' : 'What should we handle?'}
        subtitle="Pick any that apply. You can change this whenever."
      />
      <SearchBar value={search} onChange={setSearch} />
      {selected.size > 0 ? (
        <View style={styles.selectedChip}>
          <Feather name="check-circle" size={14} color={colors.primary} />
          <Text style={styles.selectedChipText}>{selected.size} selected</Text>
        </View>
      ) : null}
    </FadeIn>
  );

  if (catalogue.isPending || (editing && current.isPending)) {
    return (
      <Screen scroll={false}>
        <LoadingView message="Loading services…" />
      </Screen>
    );
  }

  const loadError = catalogue.error ?? current.error;
  if (loadError) {
    return (
      <Screen scroll={false}>
        <ErrorView
          message={errorMessage(loadError)}
          onRetry={() => {
            void catalogue.refetch();
            if (editing) void current.refetch();
          }}
        />
      </Screen>
    );
  }

  const categories: TaskCategory[] = catalogue.data?.categories ?? [];

  return (
    <Screen
      scroll={false}
      footer={
        <View style={styles.footer}>
          <View style={styles.countBlock}>
            <Feather
              name={selected.size === 0 ? 'circle' : 'check-circle'}
              size={18}
              color={selected.size === 0 ? colors.textMuted : colors.success}
            />
            <Text style={styles.count} accessibilityLiveRegion="polite">
              {selected.size === 0 ? 'Pick at least one' : `${selected.size} selected`}
            </Text>
          </View>
          <Button
            title={editing ? 'Save changes' : 'Continue'}
            icon="arrow-right"
            onPress={() => {
              setSaveError(null);
              setConfirming(true);
            }}
            disabled={selected.size === 0}
            style={styles.continue}
          />
        </View>
      }
    >
      <SectionList
        sections={sections}
        keyExtractor={(task) => task.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name={featherIcon(section.category.icon)} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{section.category.name}</Text>
              <Text style={styles.sectionSubtitle}>{section.category.description}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => <TaskCard task={item} selected={selected.has(item.id)} onToggle={toggle} />}
        ListEmptyComponent={
          search ? (
            <EmptyView
              icon="search"
              title="No matching services"
              message={`Nothing matches “${search}”. Try another word, or tell your Lifestyle Manager in your own words later.`}
              action={<Button title="Clear search" variant="secondary" icon="x" onPress={() => setSearch('')} />}
            />
          ) : (
            <EmptyView icon="inbox" title="No services yet" message="The catalogue is empty right now. Please check back soon." />
          )
        }
      />

      <ConfirmSheet
        visible={confirming}
        categories={categories}
        selected={selected}
        saving={save.isPending}
        error={saveError}
        onConfirm={() => save.mutate([...selected])}
        onClose={() => setConfirming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.xl, paddingBottom: spacing.xxl, width: '100%', maxWidth: 560, alignSelf: 'center' },
  topBar: { marginBottom: spacing.sm, marginTop: spacing.sm },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  selectedChipText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sectionTitle: typography.heading,
  sectionSubtitle: typography.caption,
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  countBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: { ...typography.label, flexShrink: 1 },
  continue: { minWidth: 150 },
});
