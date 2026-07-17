import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
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

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);


  const params = useLocalSearchParams();
  const email = params.email as string | undefined;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (loading) return;

    if (!email) {
      Alert.alert('Error', 'Missing email address');
      return;
    }

    if (!code) {
      Alert.alert('Error', 'Verify the code send to your registeredemail');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error) {
        Alert.alert('Verification Failed', 'Code has been expired or invalid');
        return;
      }

      // Success → user is authenticated
      router.replace('/reset-password');
    } catch (err) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>
              Verification email has sent to your email address
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Verification Code"
              placeholder="Enter your 8-digits code"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              prefix={<KeyRound size={20} color={colors.onSurfaceVariant} />}
            />

            <Button
              title={loading ? 'Verifying...' : 'Verify Code'}
              onPress={handleVerify}
              disabled={loading}
              style={styles.verifyButton}
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
  verifyButton: {
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