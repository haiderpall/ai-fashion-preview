import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TouchableOpacity } from 'react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme/colors';
import { rounded, spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';
export default function HelpCenterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const faqs = [
    {
      question: "How do I add or change my profile image?",
      answer: "Go to the 'Profile' tab via the bottom navigation bar. Tap on your current profile picture (or the placeholder icon) to open your device's photo library. Select a photo, and it will automatically be uploaded and saved as your new avatar."
    },
    {
      question: "How do I generate an AI try-on picture?",
      answer: "Navigate to the 'Home' tab. You will need to upload two photos: a clear front-facing photo of your customer, and a clear photo of the garment. Select the garment type from the horizontal list, then tap 'Generate AI Preview'. The process will take a few moments."
    },
    {
      question: "Where can I find my past generated previews?",
      answer: "All your previously generated AI try-on images are saved automatically. You can view them by going to the 'History' tab from the bottom navigation bar. You can tap on any item to view its details."
    },
    {
      question: "How do I switch to Dark Mode?",
      answer: "Go to the 'Settings' tab. Under the 'Appearance' section, you will find a toggle switch for Dark Mode. Tapping it will instantly switch the app's theme between light and dark modes."
    },
    {
      question: "How do I switch to Dark Mode?",
      answer: "Go to the 'Settings' tab. Under the 'Appearance' section, you will find a toggle switch for Dark Mode. Tapping it will instantly switch the app's theme between light and dark modes."
    },
    {
      question: "How do I delete my account?",
      answer: "Go to the 'Settings' tab. Under the 'Account' section, you will find a 'Delete Account' button. Tapping it will permanently delete your account and all your generated images, uploads, and history."
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <HelpCircle size={48} color={colors.primary} style={styles.heroIcon} />
          <Text style={styles.title}>How can we help you?</Text>
          <Text style={styles.subtitle}>Find answers to frequently asked questions about AI Fashion Preview below.</Text>
        </View>

        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.question}>{faq.question}</Text>
              <Text style={styles.answer}>{faq.answer}</Text>
            </View>
          ))}
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
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl * 1.5,
  },
  heroIcon: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  faqContainer: {
    gap: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: rounded.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  question: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  answer: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
});
