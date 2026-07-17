import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { spacing, rounded } from '../theme/spacing';
import { typography } from '../theme/typography';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  prefix?: React.ReactNode;
  postfix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, containerStyle, prefix, postfix, onChangeText, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    // Vibrate when adding new characters
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: error ? colors.error : colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Pressable
        onPress={handlePress}
        style={[
          styles.inputContainer,
          {
            borderColor: error ? colors.error : isFocused ? colors.primary : 'transparent',
            borderWidth: error || isFocused ? 2 : 0,
          },
        ]}
      >
        {prefix && <View style={styles.prefixContainer}>{prefix}</View>}
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor={colors.outline}
          onChangeText={handleChangeText}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {postfix && <View style={styles.postfixContainer}>{postfix}</View>}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelSm,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    backgroundColor: colors.surfaceVariant, // Using theme color instead of hardcoded hex
    borderRadius: rounded.DEFAULT, // 8px
    minHeight: 48,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixContainer: {
    marginRight: spacing.sm,
  },
  postfixContainer: {
    marginLeft: spacing.sm,
  },
  input: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.labelSm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
