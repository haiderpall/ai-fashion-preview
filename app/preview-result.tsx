import { supabase } from '@/src/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

export default function PreviewResultScreen() {
  const router = useRouter();
  const { result_image_url, customerName, customerEmail, jobId, viewOnly } = useLocalSearchParams<{
    result_image_url: string;
    customerName: string;
    customerEmail: string;
    jobId?: string;
    viewOnly?: string;
  }>();

  const isViewOnly = viewOnly === "true";
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = () => {
    // The job is already saved as "succeeded" in tryon_jobs from generation —
    // accepting just confirms and takes the user to their history log.
    router.replace('/(tabs)/history');
  };

  const handleReject = () => {
    if (isRejecting) return;
    Alert.alert(
      "Discard this preview?",
      "This generated image will be removed and won't be saved to your history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",

          onPress: async () => {
            if (!jobId) {
              router.replace('/(tabs)');
              return;
            }
            try {
              setIsRejecting(true);
              const { error, count } = await supabase
                .from('tryon_jobs')
                .delete({ count: 'exact' })
                .eq('id', jobId);

              if (error) {
                console.error("Failed to delete job:", error.message);
              } else if (count === 0) {
                console.warn("Delete matched 0 rows — check RLS policy on tryon_jobs.");
              }
            } finally {
              setIsRejecting(false);
              router.replace('/(tabs)');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isViewOnly ? "Generated Preview" : "Generation Complete"}
          </Text>
        </View>

        <Card style={styles.imageCard}>
          {result_image_url ? (
            <Image
              source={{ uri: result_image_url }}
              style={styles.resultImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ color: colors.outlineVariant }}>High Fidelity Preview</Text>
            </View>
          )}
        </Card>

        <View style={styles.customerInfoContainer}>
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerInfoLabel}>Customer Name:</Text>
            <Text
              style={styles.customerInfoValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {customerName?.trim() ? customerName : "N/A"}
            </Text>
          </View>
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerInfoLabel}>Customer Email:</Text>
            <Text
              style={styles.customerInfoValue}
              numberOfLines={2}
              ellipsizeMode="head"
            >
              {customerEmail?.trim() ? customerEmail : "N/A"}
            </Text>
          </View>
        </View>

        {!isViewOnly && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>AI Insights</Text>
            <View style={styles.insightItem}>
              <Check color={colors.primary} size={20} />
              <Text style={styles.insightText}>Fabric draping optimized</Text>
            </View>
            <View style={styles.insightItem}>
              <Check color={colors.primary} size={20} />
              <Text style={styles.insightText}>Lighting adjusted for indoor environment</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {isViewOnly ? (
            <Button
              title="Back to History"
              onPress={() => router.back()}
              style={styles.actionBtn}
            />
          ) : (
            <>
              <Button
                title="Accept & Save"
                icon={<Check color={colors.onPrimary} size={20} />}
                onPress={handleAccept}
                style={styles.actionBtn}
              />
              <Button
                title={isRejecting ? "Discarding..." : "Reject & Regenerate"}
                icon={<X color={colors.error} size={20} />}
                variant="secondary"
                onPress={handleReject}
                disabled={isRejecting}
                style={styles.actionBtn}
              />
            </>
          )}
        </View>

        {isRejecting && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  customerInfoContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  customerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  customerInfoLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flexShrink: 0,
  },
  customerInfoValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    textAlign: 'right',
  },
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  imageCard: {
    marginBottom: spacing.xl,
  },
  imagePlaceholder: {
    height: 400,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
  },
  insightsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.xl,
  },
  insightsTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  insightText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    width: '100%',
  },
});