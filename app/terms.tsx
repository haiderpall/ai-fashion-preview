import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TouchableOpacity } from 'react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Legal Agreements & Policies</Text>
        <Text style={styles.lastUpdated}>Last Updated: June 2026</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using the AI Fashion Preview app, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>2. AI Generation & Imagery</Text>
          <Text style={styles.paragraph}>
            Our service utilizes artificial intelligence to generate virtual try-on previews. The resulting images are predictions and we do not guarantee 100% accuracy in garment fit or color representation. The generated content is provided for visualization purposes only.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>3. User Content & Photos</Text>
          <Text style={styles.paragraph}>
            When you upload customer photos or clothing images, you represent that you have the right to use and share these images. We do not claim ownership over your photos. However, you grant us a temporary license to process these images through our AI models solely to provide the try-on service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>4. Data Privacy</Text>
          <Text style={styles.paragraph}>
            We prioritize your privacy. User profiles, uploaded images, and generated previews are stored securely and are only accessible to the account owner. We do not use your customer photos to train our public models without explicit consent.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>5. Account Responsibilities</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Please notify us immediately of any unauthorized use.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.titleMd,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
  },
});
