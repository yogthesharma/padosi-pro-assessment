import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

/** "Question? Action" row, e.g. "New to PadosiPro? Create an account". */
export function TextLink({ prompt, action, onPress }: { prompt?: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.row}>
      {prompt ? <Text style={styles.prompt}>{prompt} </Text> : null}
      <Pressable onPress={onPress} hitSlop={10} accessibilityRole="link">
        <Text style={styles.action}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: spacing.lg },
  prompt: typography.bodyMuted,
  action: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
