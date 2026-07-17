import { useAuth } from '@/src/lib/auth-context';
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Mail, Mars, Shirt, Sparkles, User, Venus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gender, getGarmentsForGender } from '../../constants/promptTemplate';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Colors } from '../../src/theme/colors';
import { rounded, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';

export default function HomeDashboard() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user } = useAuth();
  const [skipCustomerInfo, setSkipCustomerInfo] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [garmentCategory, setGarmentCategory] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const displayName = user?.user_metadata?.name ?? 'there';

  const [customerImage, setCustomerImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const garments = getGarmentsForGender(gender);

  const pickImage = async (type: 'camera' | 'gallery', target: 'customer' | 'clothing') => {
    let result;
    if (type === 'camera') {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        alert("You've refused to allow this app to access your camera!");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });
    } else {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("You've refused to allow this app to access your photos!");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });
    }

    if (!result.canceled) {
      if (target === 'customer') {
        setCustomerImage(result.assets[0].uri);
      } else {
        setClothingImage(result.assets[0].uri);
      }
    }
  };

  const handleGenerate = async () => {
    if (isUploading) return;

    if (!customerImage || !clothingImage || !garmentCategory) {
      Alert.alert(
        "Missing Selection",
        "Please select both photos and a garment type."
      );
      return;
    }
    if (!skipCustomerInfo) {
      if (!customerName.trim()) {
        Alert.alert("Missing Customer Info", "Please enter the customer's name, or enable Skip.");
        return;
      }

      if (!customerEmail.trim()) {
        Alert.alert("Missing Customer Info", "Please enter the customer's email, or enable Skip.");
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(customerEmail.trim())) {
        Alert.alert("Invalid Email", "Please enter a valid email address, or enable Skip.");
        return;
      }
    }
    if (!gender) {
      Alert.alert("Missing Selection", "Please select a gender before choosing a garment.");
      return;
    }
    try {
      setIsUploading(true);

      const userId = user?.id;

      if (!userId) {
        Alert.alert(
          "Error",
          "You must be logged in to generate."
        );
        return;
      }

      console.log("Compressing person image...");

      const compressedPerson =
        await ImageManipulator.manipulateAsync(
          customerImage,
          [
            {
              resize: {
                width: 1024,
              },
            },
          ],
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

      console.log("Compressing garment image...");

      const compressedGarment =
        await ImageManipulator.manipulateAsync(
          clothingImage,
          [
            {
              resize: {
                width: 1024,
              },
            },
          ],
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

      router.push({
        pathname: "/ai-processing",
        params: {
          personUri: compressedPerson.uri,
          garmentUri: compressedGarment.uri,
          category: garmentCategory,
          gender: gender,
          customerName: skipCustomerInfo ? "" : customerName,
          customerEmail: skipCustomerInfo ? "" : customerEmail,
        },
      });
    } catch (error: any) {
      console.error("Generate Error:", error);

      Alert.alert(
        "Generation Failed",
        error.message || "Unknown error."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}
      edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {displayName}</Text>
            <Text style={styles.subtitle}>Ready to make new AI-Previews for your clients today?</Text>
          </View>
        </View>

        {/* 1. Customer Information Card */}
        <Card style={[styles.card, styles.cardShadow]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Customer Information</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Skip</Text>
              <Switch
                value={skipCustomerInfo}
                onValueChange={setSkipCustomerInfo}
                trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            </View>
          </View>
          {!skipCustomerInfo && (
            <View style={styles.cardBody}>
              <Input
                label="Name *"
                placeholder="Customer Name"
                value={customerName}
                onChangeText={setCustomerName}
                prefix={<User size={20} color={colors.onSurfaceVariant} />}
              />
              <Input
                label="Email *"
                placeholder="Customer Email"
                value={customerEmail}
                onChangeText={setCustomerEmail}
                keyboardType="email-address"
                prefix={<Mail size={20} color={colors.onSurfaceVariant} />}
              />
            </View>
          )}
        </Card>

        {/* 2. Customer Photo Card */}
        <Card style={[styles.photoCard, styles.cardShadow]}>
          <User size={32} color={colors.primary} style={styles.photoIcon} />
          <Text style={styles.photoCardTitle}>Customer Photo</Text>
          <Text style={styles.photoCardSubtitle}>Please provide a front-facing clear portrait of the customer.</Text>

          {customerImage && <Image source={{ uri: customerImage }} style={styles.previewImage} />}

          <View style={styles.buttonRow}>
            <Button
              title="Camera"
              icon={<Camera size={20} color={colors.primary} />}
              style={styles.whiteButton}
              textStyle={styles.whiteButtonText}
              onPress={() => pickImage('camera', 'customer')}
            />
            <Button
              title="Gallery"
              icon={<ImageIcon size={20} color={colors.primary} />}
              style={styles.whiteButton}
              textStyle={styles.whiteButtonText}
              onPress={() => pickImage('gallery', 'customer')}
            />
          </View>
        </Card>

        {/* 3. Clothing Photo Card */}
        <Card style={[styles.photoCard, styles.cardShadow]}>
          <Shirt size={32} color={colors.primary} style={styles.photoIcon} />
          <Text style={styles.photoCardTitle}>Clothing Photo</Text>
          <Text style={styles.photoCardSubtitle}>Please provide a clear photo of the garment or fabric.</Text>

          {clothingImage && <Image source={{ uri: clothingImage }} style={styles.previewImage} />}

          <View style={styles.buttonRow}>
            <Button
              title="Camera"
              icon={<Camera size={20} color={colors.primary} />}
              style={styles.whiteButton}
              textStyle={styles.whiteButtonText}
              onPress={() => pickImage('camera', 'clothing')}
            />
            <Button
              title="Gallery"
              icon={<ImageIcon size={20} color={colors.primary} />}
              style={styles.whiteButton}
              textStyle={styles.whiteButtonText}
              onPress={() => pickImage('gallery', 'clothing')}
            />
          </View>
        </Card>
        {/* Gender Selection */}
        <View style={[styles.section, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.genderRow}>
            {(["Men", "Women"] as Gender[]).map((g) => {
              const isSelected = gender === g;
              const Icon = g === "Men" ? Mars : Venus;
              const accentColor = g === "Men" ? "#3B82F6" : "#EC4899";

              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderCard,
                    isSelected && {
                      backgroundColor: g === "Men" ? "#EFF6FF" : "#FDF2F8",
                      borderColor: accentColor,
                    },
                  ]}
                  onPress={() => {
                    setGender(g);
                    setGarmentCategory(null); // reset garment choice when gender changes
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.genderLeft}>
                    <Icon
                      size={24}
                      color={isSelected ? accentColor : colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.genderLabel,
                        isSelected && { color: "#000000", fontFamily: typography.titleMd.fontFamily },
                      ]}
                    >
                      {g}
                    </Text>
                  </View>

                  <View style={[styles.radioOuter, isSelected && { borderColor: accentColor }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Garment Selection Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Garment Selection</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
            {garments.map((garment) => (
              <TouchableOpacity
                key={garment}
                style={[
                  styles.chip,
                  garmentCategory === garment && styles.chipSelected
                ]}
                onPress={() => setGarmentCategory(garment)}
              >
                <Text style={[
                  styles.chipText,
                  garmentCategory === garment && styles.chipTextSelected
                ]}>{garment}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 5. Generate AI Preview Button */}
        <Button
          title={isUploading ? "Uploading..." : "Generate AI Preview"}
          icon={<Sparkles size={20} color={colors.onPrimary} />}
          onPress={handleGenerate}
          disabled={isUploading}
          style={styles.generateBtn}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginLeft: spacing.md,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    paddingRight: spacing.xl,
  },
  settingsBtn: {
    width: 48,
    paddingHorizontal: 0,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  switchContainer: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  switchLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardBody: {
    marginTop: spacing.sm,
  },
  photoCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderRadius: rounded.xl,
  },
  photoIcon: {
    marginBottom: spacing.md,
  },
  photoCardTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  photoCardSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: rounded.md,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',

  },
  whiteButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  whiteButtonText: {
    color: colors.onSurface,
  },
  chipList: {
    gap: spacing.sm,
    marginVertical: spacing.sm
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: rounded.full,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: typography.titleMd.fontFamily,
  },
  generateBtn: {
    marginBottom: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: rounded.xl,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  genderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  genderLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6, // Android
  },
});