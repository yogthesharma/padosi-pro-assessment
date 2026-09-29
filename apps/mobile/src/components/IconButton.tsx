import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { colors, radius } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

/** Circular icon control for headers — sits in the easy-reach top corners. */
export function IconButton({
  icon,
  onPress,
  label,
  tone = 'muted',
  size = 40,
}: {
  icon: FeatherName;
  onPress: () => void;
  label: string;
  tone?: 'muted' | 'primary' | 'onPrimary';
  size?: number;
}) {
  const tones = {
    muted: { bg: colors.surfaceMuted, fg: colors.textSubtle },
    primary: { bg: colors.primaryMuted, fg: colors.primary },
    onPrimary: { bg: 'rgba(255,255,255,0.18)', fg: colors.white },
  }[tone];

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={8}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tones.bg,
        },
      ]}
    >
      <Feather name={icon} size={Math.round(size * 0.45)} color={tones.fg} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
