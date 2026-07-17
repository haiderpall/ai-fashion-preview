import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { supabase } from '../src/lib/supabase';
import { Colors } from '../src/theme/colors';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (isResetting) return;

    if (!password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsResetting(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert('Reset Failed', error.message);
        return;
      }

      Alert.alert('Success', 'Password has been reset successfully!', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Create a new password for your account.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="New Password"
              placeholder="Create a new password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              prefix={<Lock size={20} color={colors.onSurfaceVariant} />}
              postfix={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={colors.onSurfaceVariant} />
                  ) : (
                    <Eye size={20} color={colors.onSurfaceVariant} />
                  )}
                </TouchableOpacity>
              }
            />
            <Input
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              prefix={<MaterialIcons name="lock-reset" size={23} color={colors.onSurfaceVariant} />}
              postfix={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.onSurfaceVariant} />
                  ) : (
                    <Eye size={20} color={colors.onSurfaceVariant} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title={isResetting ? 'Resetting...' : 'Reset Password'}
              onPress={handleReset}
              disabled={isResetting}
              style={styles.resetButton}
            />

            <View style={styles.loginPrompt}>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl * 1.5,
    alignItems: 'center',
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  resetButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLink: {
    ...typography.bodyMd,
    color: colors.primary,
    fontFamily: typography.titleMd.fontFamily,
  },
});
