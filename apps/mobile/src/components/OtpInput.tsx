import { OTP_LENGTH } from '@padosipro/shared';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

/**
 * One transparent input laid over six display boxes: tapping anywhere focuses it, and paste
 * and one-time-code autofill work because it's a single real field.
 */
export function OtpInput({ value, onChange, error, disabled }: OtpInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const char = value[index] ?? '';
          const active = focused && index === Math.min(value.length, OTP_LENGTH - 1);
          return (
            <View
              key={index}
              style={[styles.box, char ? styles.filled : null, active ? styles.active : null, error ? styles.error : null]}
            >
              <Text style={styles.char}>{char}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        editable={!disabled}
        autoFocus
        caretHidden
        selectionColor="transparent"
        style={styles.overlayInput}
        accessibilityLabel="Enter the 6-digit code"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  box: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 0.85,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { borderColor: colors.textMuted },
  active: { borderColor: colors.primary, borderWidth: 2 },
  error: { borderColor: colors.error, backgroundColor: colors.errorMuted },
  char: { fontSize: 24, fontWeight: '700', color: colors.text },
  overlayInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
    opacity: 0.02,
    fontSize: 1,
  },
});
