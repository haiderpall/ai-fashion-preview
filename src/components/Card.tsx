import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ViewProps } from 'react-native';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { rounded } from '../theme/spacing';

interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: rounded.lg, // 16px corner radius for cards
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden', // to ensure content bleeds to edges (like images)
    // Level 1 elevation (subtle, outline does most of the work)
  },
});
