import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.container}>
      <Feather name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search services"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search services"
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear search">
          <Feather name="x-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
});
