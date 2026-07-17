import { useRouter } from 'expo-router';
import { Bell, ChevronRight, ExternalLink, FileText, HelpCircle, MoonStar, ShieldCheck, } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../src/theme/ThemeContext';
import { Colors } from '../../src/theme/colors';
import { rounded, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['left', 'right']}>

      <Text style={styles.pageTitle}>Settings</Text>

      <Text style={styles.description}>
        Manage your account preferences and application behavior.
      </Text>

      {/* Appearance */}
      <Text style={styles.sectionLabel}>Appearance</Text>

      <View style={styles.card}>
        <View style={[styles.settingRow, styles.lastRow]}>
          <View style={styles.settingInfo}>
            <View style={styles.iconWrapper}>
              <MoonStar
                size={20}
                color={colors.onSurface}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>
                Dark Mode
              </Text>

              <Text style={styles.settingDescription}>
                Switch between light and dark themes.
              </Text>
            </View>
          </View>

          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{
              false: colors.outlineVariant,
              true: colors.primary,
            }}
            thumbColor={
              isDark
                ? colors.surface
                : '#FFFFFF'
            }
          />
        </View>
      </View>

      {/* Preferences */}
      <Text style={styles.sectionLabel}>Preferences</Text>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          activeOpacity={0.75}
        >
          <View style={styles.settingInfo}>
            <View style={styles.iconWrapper}>
              <Bell
                size={20}
                color={colors.onSurface}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>
                Notifications
              </Text>

              <Text style={styles.settingDescription}>
                Manage push alerts and updates.
              </Text>
            </View>
          </View>

          <ChevronRight
            size={20}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingRow, styles.lastRow]}
          activeOpacity={0.75}
        >
          <View style={styles.settingInfo}>
            <View style={styles.iconWrapper}>
              <ShieldCheck
                size={20}
                color={colors.onSurface}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>
                Privacy
              </Text>

              <Text style={styles.settingDescription}>
                Data usage and security settings.
              </Text>
            </View>
          </View>

          <ChevronRight
            size={20}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Information */}
      <Text style={styles.sectionLabel}>Information</Text>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          activeOpacity={0.75}
          onPress={() => router.push('/terms')}
        >
          <View style={styles.settingInfo}>
            <View style={styles.iconWrapper}>
              <FileText
                size={20}
                color={colors.onSurface}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>
                Terms of Service
              </Text>

              <Text style={styles.settingDescription}>
                Legal agreements and policies.
              </Text>
            </View>
          </View>

          <ExternalLink
            size={20}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingRow, styles.lastRow]}
          activeOpacity={0.75}
          onPress={() => router.push('/help')}
        >
          <View style={styles.settingInfo}>
            <View style={styles.iconWrapper}>
              <HelpCircle
                size={20}
                color={colors.onSurface}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.settingLabel}>
                Help Center
              </Text>

              <Text style={styles.settingDescription}>
                FAQs and customer support.
              </Text>
            </View>
          </View>

          <ChevronRight
            size={20}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    paddingTop: spacing.md,
  },


  pageTitle: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.xs,
    marginLeft: spacing.md,
  },

  description: {
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  sectionLabel: {
    ...typography.labelSm,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },

  card: {
    borderRadius: rounded.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },

  iconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },

  textContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },

  settingLabel: {
    ...typography.titleMd,
    color: colors.onSurface,
  },

  settingDescription: {
    marginTop: 4,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
  },
});