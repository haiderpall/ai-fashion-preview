import { supabase } from '@/src/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Colors } from '../../src/theme/colors';
import { rounded, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';

type TryonJob = {
  id: string;
  result_image_url: string | null;
  garment_category: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  created_at: string;
};

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [jobs, setJobs] = useState<TryonJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('tryon_jobs')
      .select('*')
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load history:', error.message);
    } else {
      setJobs(data ?? []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchJobs();
      setIsLoading(false);
    })();
  }, [fetchJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setIsRefreshing(false);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' · ' + d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Preview History</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No generations yet.</Text>
          <Text style={styles.emptySubtext}>Your completed try-on previews will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const displayLabel = item.customer_name?.trim()
              ? item.customer_name
              : formatDate(item.created_at);

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/preview-result',
                    params: {
                      result_image_url: item.result_image_url ?? '',
                      customerName: item.customer_name ?? '',
                      customerEmail: item.customer_email ?? '',
                      viewOnly: 'true',
                    },
                  })
                }
              >
                <Card style={styles.card}>
                  <View style={styles.cardRow}>
                    {item.result_image_url ? (
                      <Image source={{ uri: item.result_image_url }} style={styles.thumbnail} />
                    ) : (
                      <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
                    )}

                    <View style={styles.cardBody}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{displayLabel}</Text>
                        <View style={[styles.statusBadge, styles.statusCompleted]}>
                          <Text style={[styles.statusText, styles.statusTextCompleted]}>
                            {item.garment_category ?? 'Completed'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginLeft: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: rounded.md,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.surfaceVariant,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    flexShrink: 1,
  },
  cardDate: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 100,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    ...typography.labelSm,
  },
  statusTextCompleted: {
    color: '#065F46',
  },
});