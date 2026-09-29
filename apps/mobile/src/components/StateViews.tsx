import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

export function LoadingView({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.caption}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry, extra }: { message: string; onRetry: () => void; extra?: ReactNode }) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: colors.errorMuted }]}>
        <Feather name="wifi-off" size={26} color={colors.error} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Try again" icon="refresh-cw" onPress={onRetry} style={styles.action} />
      {extra}
    </View>
  );
}

export function EmptyView({
  icon = 'inbox',
  title,
  message,
  action,
}: {
  icon?: ComponentProps<typeof Feather>['name'];
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading, textAlign: 'center', marginBottom: spacing.sm },
  message: { ...typography.bodyMuted, textAlign: 'center', marginBottom: spacing.lg, maxWidth: 320 },
  caption: { ...typography.caption, marginTop: spacing.md },
  action: { minWidth: 180 },
});
