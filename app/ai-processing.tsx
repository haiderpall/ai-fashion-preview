import { Button } from '@/src/components/Button';
import { analyzeImages } from '@/src/lib/openai-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Gender, getPromptForGarment } from '../constants/promptTemplate';
import { Colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { useTheme } from '../src/theme/ThemeContext';
import { typography } from '../src/theme/typography';

const PROGRESS_COLOR = "#6E01EF";
const RING_SIZE = 160;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// How long the simulated climb to ~90% takes. Real generations usually
// finish within this window; if they take longer, progress just holds at 90%
// until the actual result comes back, then jumps to 100%.
const SIMULATED_DURATION_MS = 18000;
const SIMULATED_CAP = 90;

const STATUS_MESSAGES = [
  "Analyzing fabric and texture...",
  "Reading garment details...",
  "Matching color and pattern...",
  "Fitting to your photo...",
  "Rendering final preview...",
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AIProcessingScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { personUri, garmentUri, category, gender, customerName, customerEmail } = useLocalSearchParams<{
    personUri: string;
    garmentUri: string;
    category: string;
    gender: Gender;
    customerName?: string;
    customerEmail?: string;
  }>();

  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);

  const progress = useRef(new Animated.Value(0)).current;
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setDisplayPercent(Math.round(value));
    });
    return () => progress.removeListener(id);
  }, []);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [error]);

  const startSimulatedProgress = () => {
    progress.setValue(0);
    progressAnimRef.current = Animated.timing(progress, {
      toValue: SIMULATED_CAP,
      duration: SIMULATED_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // strokeDashoffset can't use the native driver
    });
    progressAnimRef.current.start();
  };

  const completeProgress = (onDone?: () => void) => {
    progressAnimRef.current?.stop();
    Animated.timing(progress, {
      toValue: 100,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => onDone?.());
  };

  const runGeneration = async () => {
    try {
      setError(null);
      startSimulatedProgress();

      const images = [
        { uri: personUri, name: "person.jpg", type: "image/jpeg" },
        { uri: garmentUri, name: "garment.jpg", type: "image/jpeg" },
      ];

      const prompt = getPromptForGarment(gender, category);

      if (!prompt) {
        throw new Error("Could not find a matching prompt for this garment/gender combination.");
      }

      const result = await analyzeImages(
        images,
        prompt,
        category,
        customerName,
        customerEmail
      );

      completeProgress(() => {
        router.replace({
          pathname: "/preview-result",
          params: {
            result_image_url: result.imageUri,
            jobId: result.jobId,
            customerName: customerName || "",
            customerEmail: customerEmail || "",
          },
        });
      });
    } catch (e: any) {
      progressAnimRef.current?.stop();
      setError(e.message || "Generation failed");
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (!personUri || !garmentUri || !category) {
      setError("Missing image or category data");
      return;
    }
    runGeneration();
  }, []);

  const handleRetry = () => {
    if (isRetrying) return;
    setIsRetrying(true);
    runGeneration();
  };

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!error ? (
          <>
            <View style={styles.ringContainer}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                {/* Track */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke={colors.surfaceVariant}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                {/* Progress */}
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke={PROGRESS_COLOR}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>

              <View style={styles.centerOverlay}>
                <Text style={styles.percentText}>{displayPercent}%</Text>
                <Text style={styles.iconText}>✨</Text>
              </View>
            </View>

            <Text style={styles.title}>AI Processing</Text>
            <Text style={styles.subtitle}>{STATUS_MESSAGES[statusIndex]}</Text>
          </>
        ) : (
          <>
            <View style={[styles.centerOverlay, styles.errorCircle]}>
              <Text style={styles.errorText}>Error</Text>
            </View>
            <Text style={styles.title}>Generation Failed</Text>
            <Text style={styles.subtitle}>{error}</Text>

            <Button
              title={isRetrying ? "Retrying..." : "Try Again"}
              onPress={handleRetry}
              disabled={isRetrying}
              style={{ marginTop: spacing.xl, width: '100%' }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  centerOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    ...typography.titleMd,
    color: PROGRESS_COLOR,
    fontSize: 28,
    fontWeight: '700',
  },
  iconText: {
    fontSize: 26,
    marginTop: 2,
  },
  errorCircle: {
    width: RING_SIZE * 0.6,
    height: RING_SIZE * 0.6,
    borderRadius: (RING_SIZE * 0.6) / 2,
    backgroundColor: colors.error,
    position: 'relative',
    marginBottom: spacing.xl * 2,
  },
  errorText: {
    ...typography.titleMd,
    color: '#FFFFFF',
    fontSize: 20,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});