import { useAuth } from '@/src/lib/auth-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Store, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { typography } from '../src/theme/typography';

export default function SignUpScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [shopname, setShopname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { signUp, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [loading, user]);

  const handleSignUp = async () => {
    if (isSigningUp) return;

    if (!name || !shopname || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsSigningUp(true);

      const { error } = await signUp(email, password, {
        name,
        shopname,
      });

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
        return;
      }

      Alert.alert(
        'Account Created',
        'Your account has been created successfully.'
      );

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsSigningUp(false);
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
            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.subtitle}>
              Start providing AI-Powered Preview to your clients today.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Shop Name"
              placeholder="e.g. Chughtai Son's Fabric & Tailor"
              value={shopname}
              onChangeText={setShopname}
              prefix={
                <Store
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              }
            />

            <Input
              label="Owner Name"
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              prefix={
                <User
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              }
            />

            <Input
              label="Email Address"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              prefix={
                <Mail
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              }
            />

            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              prefix={
                <Lock
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              }
              postfix={
                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      color={colors.onSurfaceVariant}
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={colors.onSurfaceVariant}
                    />
                  )}
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              prefix={
                <MaterialIcons
                  name="lock-reset"
                  size={23}
                  color={colors.onSurfaceVariant}
                />
              }
              postfix={
                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      size={20}
                      color={colors.onSurfaceVariant}
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={colors.onSurfaceVariant}
                    />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title={
                isSigningUp
                  ? 'Creating Account...'
                  : 'Sign Up'
              }
              onPress={handleSignUp}
              disabled={isSigningUp}
              style={styles.signUpButton}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                Already have an account?{' '}
              </Text>

              <Text
                style={styles.loginLink}
                onPress={() => router.push('/login')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },

  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },

  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },

  form: {
    gap: spacing.md,
  },

  signUpButton: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginPromptText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },

  loginLink: {
    ...typography.bodyMd,
    color: colors.primary,
    fontFamily: typography.titleMd.fontFamily,
  },
});