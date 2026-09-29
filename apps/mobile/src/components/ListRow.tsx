import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors, radius, spacing, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

/** Settings / account row — large tap target for thumbs. */
export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'default',
  right,
}: {
  icon: FeatherName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  right?: ReactNode;
}) {
  const iconBg = tone === 'danger' ? colors.errorMuted : colors.primaryMuted;
  const iconFg = tone === 'danger' ? colors.error : colors.primary;
  const titleColor = tone === 'danger' ? colors.error : colors.text;

  const body = (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={18} color={iconFg} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={18} color={colors.textMuted} /> : null)}
    </View>
  );

  if (!onPress) return <View style={styles.shell}>{body}</View>;

  return (
    <PressableScale onPress={onPress} accessibilityLabel={title} style={styles.shell}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    minHeight: 64,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { ...typography.body, fontWeight: '600' },
  subtitle: { ...typography.caption, marginTop: 2 },
});
