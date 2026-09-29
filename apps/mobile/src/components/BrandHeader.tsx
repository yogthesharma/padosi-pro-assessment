import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export function BrandHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.brand}>PadosiPro</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl, marginTop: spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoText: { color: colors.accent, fontSize: 20, fontWeight: '800' },
  brand: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: 0.2 },
  title: { ...typography.title, marginBottom: spacing.sm },
  subtitle: typography.bodyMuted,
});
