import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Tone = 'error' | 'info' | 'success' | 'warning';

const tones: Record<Tone, { bg: string; fg: string; icon: 'alert-circle' | 'info' | 'check-circle' | 'alert-triangle' }> = {
  error: { bg: colors.errorMuted, fg: colors.error, icon: 'alert-circle' },
  info: { bg: colors.primaryMuted, fg: colors.primary, icon: 'info' },
  success: { bg: colors.successMuted, fg: colors.success, icon: 'check-circle' },
  warning: { bg: colors.warningMuted, fg: colors.warning, icon: 'alert-triangle' },
};

export function Banner({ tone = 'error', message, action }: { tone?: Tone; message: string; action?: ReactNode }) {
  const theme = tones[tone];
  return (
    <View
      style={[styles.container, { backgroundColor: theme.bg }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Feather name={theme.icon} size={18} color={theme.fg} style={styles.icon} />
      <View style={styles.body}>
        <Text style={[styles.text, { color: theme.fg }]}>{message}</Text>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  icon: { marginRight: spacing.sm, marginTop: 2 },
  body: { flex: 1, gap: spacing.xs },
  text: { ...typography.body, fontSize: 14, lineHeight: 20 },
});
