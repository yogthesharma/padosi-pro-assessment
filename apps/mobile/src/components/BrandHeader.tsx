import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { FadeIn } from '@/components/FadeIn';
import { colors, radius, spacing, typography } from '@/theme';

export function BrandHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <FadeIn style={styles.container}>
      <View style={styles.brandRow}>
        <LinearGradient colors={[colors.primary, colors.heroWash]} style={styles.logo}>
          <Text style={styles.logoText}>P</Text>
        </LinearGradient>
        <View>
          <Text style={styles.brand}>PadosiPro</Text>
          <Text style={styles.tagline}>Lifestyle Manager</Text>
        </View>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl, marginTop: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.md },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  brand: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: 0.2 },
  tagline: { ...typography.caption, marginTop: 1 },
  title: { ...typography.title, marginBottom: spacing.sm },
  subtitle: typography.bodyMuted,
});
