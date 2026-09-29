import { Feather } from '@expo/vector-icons';
import type { TaskCategory } from '@padosipro/shared';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { featherIcon } from '@/lib/icons';
import { colors, radius, spacing, typography } from '@/theme';

interface ConfirmSheetProps {
  visible: boolean;
  categories: TaskCategory[];
  selected: Set<string>;
  saving: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Review step before saving: lists the picks grouped by category. */
export function ConfirmSheet({ visible, categories, selected, saving, error, onConfirm, onClose }: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const groups = categories
    .map((category) => ({ category, tasks: category.tasks.filter((task) => selected.has(task.id)) }))
    .filter((group) => group.tasks.length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Confirm your tasks</Text>
        <Text style={styles.subtitle}>
          Your Lifestyle Manager will take these on. You can change them whenever.
        </Text>

        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: spacing.md }}>
          {groups.map(({ category, tasks }) => (
            <View key={category.id} style={styles.group}>
              <View style={styles.groupHeader}>
                <Feather name={featherIcon(category.icon)} size={15} color={colors.primary} />
                <Text style={styles.groupTitle}>{category.name}</Text>
              </View>
              {tasks.map((task) => (
                <View key={task.id} style={styles.item}>
                  <Feather name="check" size={15} color={colors.success} />
                  <Text style={styles.itemText}>{task.name}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        {error ? <Banner message={error} /> : null}
        <Button title={`Confirm ${selected.size} task${selected.size === 1 ? '' : 's'}`} onPress={onConfirm} loading={saving} />
        <Button title="Keep editing" variant="ghost" onPress={onClose} disabled={saving} style={{ marginTop: spacing.xs }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16, 24, 40, 0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 8,
    borderTopRightRadius: radius.lg + 8,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMuted, marginBottom: spacing.lg },
  list: { flexGrow: 0 },
  group: { marginBottom: spacing.md },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  groupTitle: { ...typography.label, color: colors.primary },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4, paddingLeft: spacing.xs },
  itemText: typography.body,
});
