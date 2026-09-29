import { Feather } from '@expo/vector-icons';
import type { Task } from '@padosipro/shared';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface TaskCardProps {
  task: Task;
  selected: boolean;
  onToggle: (taskId: string) => void;
}

export const TaskCard = memo(function TaskCard({ task, selected, onToggle }: TaskCardProps) {
  return (
    <Pressable
      onPress={() => onToggle(task.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={task.name}
      accessibilityHint={task.description}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text style={styles.name}>{task.name}</Text>
        <Text style={styles.description}>{task.description}</Text>
      </View>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <Feather name="check" size={16} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  pressed: { opacity: 0.85 },
  text: { flex: 1 },
  name: { ...typography.body, fontWeight: '700', marginBottom: 2 },
  description: typography.caption,
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
