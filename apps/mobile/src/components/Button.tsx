import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors, radius, shadow, spacing } from '@/theme';

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

const palette: Record<Variant, { bg: string; text: string; border: string }> = {
  primary: { bg: colors.primary, text: colors.white, border: colors.primary },
  secondary: { bg: colors.surface, text: colors.primary, border: colors.border },
  ghost: { bg: 'transparent', text: colors.primary, border: 'transparent' },
  danger: { bg: colors.errorMuted, text: colors.error, border: colors.errorMuted },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, accessibilityHint }: ButtonProps) {
  const theme = palette[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        variant === 'primary' && shadow.soft,
        { backgroundColor: theme.bg, borderColor: theme.border },
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
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  ghost: { minHeight: 44, borderWidth: 0 },
  inactive: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  icon: { marginRight: spacing.sm },
  text: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
