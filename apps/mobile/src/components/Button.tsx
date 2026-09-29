import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Feather>['name'];
  style?: ViewStyle;
  accessibilityHint?: string;
}

const palette: Record<Variant, { bg: string; pressed: string; text: string; border: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, text: colors.white, border: colors.primary },
  secondary: { bg: colors.surface, pressed: colors.surfaceMuted, text: colors.primary, border: colors.border },
  ghost: { bg: 'transparent', pressed: colors.surfaceMuted, text: colors.primary, border: 'transparent' },
  danger: { bg: colors.surface, pressed: colors.errorMuted, text: colors.error, border: colors.border },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, accessibilityHint }: ButtonProps) {
  const theme = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? theme.pressed : theme.bg, borderColor: theme.border },
        variant === 'ghost' && styles.ghost,
        inactive && styles.inactive,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <>
            {icon ? <Feather name={icon} size={17} color={theme.text} style={styles.icon} /> : null}
            <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  ghost: { minHeight: 44 },
  inactive: { opacity: 0.55 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: spacing.sm },
  text: { fontSize: 16, fontWeight: '700' },
});
