import { useAuth } from '@/src/lib/auth-context';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, LogOut, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const name = user?.user_metadata?.name ?? 'User';
  const email = user?.email ?? 'No email';
  const shopname = user?.user_metadata?.shopname ?? 'My Shop';

  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.user_metadata?.avatar_url ?? null
  );
  const [uploading, setUploading] = useState(false);

  // ================================
  // Upload image to Supabase Storage
  // ================================
  const uploadAvatar = async (uri: string) => {
    if (!user) throw new Error('No user found');

    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    // The bucket is 'avatars', so we can just place it at the root of the bucket
    const filePath = `${fileName}`;

    console.debug('[profile] uploadAvatar:start', { uri, filePath });

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    console.debug('[profile] read base64 length', { length: base64.length });

    console.debug('[profile] uploading to supabase', { filePath });
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    console.debug('[profile] supabase upload response', { error });
    if (error) throw error;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.debug('[profile] publicUrl', { publicUrl: data.publicUrl });

    return data.publicUrl;
  };

  // ================================
  // Pick Image
  // ================================
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    console.debug('[profile] picked image uri', { uri });

    try {
      setUploading(true);
      console.debug('[profile] upload:start', { uri });

      const publicUrl = await uploadAvatar(uri);
      console.debug('[profile] upload:success', { publicUrl });

      setAvatarUri(publicUrl);

      // Save into Supabase Auth metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          name,
          shopname,
          avatar_url: publicUrl,
        },
      });

      if (error) throw error;

      Alert.alert('Success', 'Profile photo updated!');
    } catch (err: any) {
      console.debug('[profile] upload:failed', err);
      Alert.alert('Upload Failed', err?.message ?? String(err));
    } finally {
      setUploading(false);
    }
  };

  // ================================
  // Logout
  // ================================
  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Shop Profile</Text>
        </View>

        {/* AVATAR */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <User size={40} color={colors.surface} />
                </View>
              )}

              {/* CAMERA BADGE */}
              <View style={styles.cameraBadge}>
                <Camera size={14} color={colors.surface} />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>

          {uploading && (
            <Text style={{ color: colors.primary, marginTop: 6 }}>
              Uploading...
            </Text>
          )}
        </View>

        {/* INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Shop Name</Text>
            <Text style={styles.detailValue}>{shopname}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>Basic</Text>
          </View>
        </View>

        {/* LOGOUT */}
        <Button
          title="Log Out"
          variant="secondary"
          icon={<LogOut color={colors.primary} size={20} />}
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginLeft: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 1.5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    top: 55,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  confirmPhotoButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  name: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  detailLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 'auto',
  },
});
