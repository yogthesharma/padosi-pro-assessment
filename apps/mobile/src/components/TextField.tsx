import { Feather } from '@expo/vector-icons';
import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  /** Fixed text shown before the input, e.g. "+91". */
  prefix?: ReactNode;
  /** Adds a show/hide toggle for password fields. */
  secureToggle?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, optional, prefix, secureToggle, multiline, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      <View style={[styles.inputRow, { borderColor }, multiline && styles.multilineRow]}>
        {prefix ? <View style={styles.prefix}>{typeof prefix === 'string' ? <Text style={styles.prefixText}>{prefix}</Text> : prefix}</View> : null}
        <TextInput
          ref={ref}
          style={[styles.input, multiline && styles.multilineInput]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureToggle ? hidden : inputProps.secureTextEntry}
          multiline={multiline}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          {...inputProps}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={styles.toggle}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <Feather name="alert-circle" size={14} color={colors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.xs + 2 },
  optional: { fontWeight: '400', color: colors.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    minHeight: 50,
  },
  multilineRow: { alignItems: 'flex-start' },
  prefix: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  prefixText: { ...typography.body, fontWeight: '600', color: colors.textSubtle },
  input: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
  multilineInput: { minHeight: 96, textAlignVertical: 'top' },
  toggle: { paddingHorizontal: spacing.md },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs + 2, gap: 6 },
  error: { ...typography.caption, color: colors.error, flex: 1 },
  hint: { ...typography.caption, marginTop: spacing.xs + 2 },
});
