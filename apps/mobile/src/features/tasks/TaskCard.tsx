import { Feather } from '@expo/vector-icons';
import type { Task } from '@padosipro/shared';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors, radius, shadow, spacing, typography } from '@/theme';

interface TaskCardProps {
  task: Task;
  selected: boolean;
  onToggle: (taskId: string) => void;
}

export const TaskCard = memo(function TaskCard({ task, selected, onToggle }: TaskCardProps) {
  return (
    <PressableScale
      onPress={() => onToggle(task.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={task.name}
      accessibilityHint={task.description}
      style={[styles.card, selected && styles.selected]}
    >
      <View style={styles.text}>
        <Text style={styles.name}>{task.name}</Text>
        <Text style={styles.description}>{task.description}</Text>
      </View>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <Feather name="check" size={16} color={colors.white} /> : null}
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
    ...shadow.card,
  },
  text: { flex: 1 },
  name: { ...typography.body, fontWeight: '700', marginBottom: 2 },
  description: typography.caption,
  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
