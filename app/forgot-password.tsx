import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { supabase } from '../src/lib/supabase';
import { Colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import { typography } from '../src/theme/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Send a one-time OTP to the user's email
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        console.log("OTP Error message:", error.message);
        console.log("OTP Error status:", error.status);
        Alert.alert(
          'Check your email',
          'If an account exists with this email, a verification code has been sent.'
        );
        router.replace(`/verify-code?email=${encodeURIComponent(email)}`);
        return;
      }

      Alert.alert('Success', 'A reset password 8-digit OTP has been sent to your email.');
      // pass email to verify screen so it can verify the code
      router.replace(`/verify-code?email=${encodeURIComponent(email)}`);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email address to receive a verification code to reset your password.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              prefix={<Mail size={20} color={colors.onSurfaceVariant} />}
            />

            <Button
              title={isSubmitting ? 'Submitting...' : 'Submit Now'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
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
  submitButton: {
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
