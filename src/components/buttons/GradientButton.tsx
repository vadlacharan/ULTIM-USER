import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, GRADIENTS, RADIUS, SHADOWS } from '../../theme/theme';
import { AnimatedPressable } from './AnimatedPressable';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type GradientButtonVariant = 'primary' | 'danger' | 'dark' | 'success';

const VARIANT_GRADIENTS: Record<GradientButtonVariant, readonly [string, string]> = {
  primary: [...GRADIENTS.primaryButton],
  danger: [...GRADIENTS.dangerButton],
  dark: [...GRADIENTS.darkButton],
  success: [...GRADIENTS.successButton],
};

const VARIANT_TEXT: Record<GradientButtonVariant, string> = {
  primary: COLORS.onPrimary, // near-black on ember — the functional accent
  danger: '#FFFFFF',
  dark: '#FFFFFF',
  success: '#04150D',
};

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  icon?: IoniconName;
  iconPosition?: 'left' | 'right';
  variant?: GradientButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Smaller padding/font for inline/chip-style CTAs. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * The app's primary "premium" call-to-action button — a soft gradient pill
 * with a tactile press animation. Use for the single most important action
 * on a screen (book, confirm, sign in, sign out/destructive via `variant="danger"`).
 */
export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  compact = false,
  style,
  textStyle,
}) => {
  const gradientColors = VARIANT_GRADIENTS[variant];
  const contentColor = VARIANT_TEXT[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.base,
          compact ? styles.compact : styles.regular,
          fullWidth && styles.fullWidth,
          variant === 'primary' && styles.emberGlow,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={contentColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={compact ? 14 : 16}
                color={contentColor}
                style={styles.iconLeft}
              />
            )}
            <Text style={[styles.text, compact ? styles.textCompact : styles.textRegular, { color: contentColor }, textStyle]}>
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={compact ? 14 : 16}
                color={contentColor}
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  regular: {
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  compact: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  emberGlow: SHADOWS.ember,
  text: {
    fontFamily: FONTS.bold,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  textRegular: {
    fontSize: 13,
    letterSpacing: 1.6,
  },
  textCompact: {
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  iconLeft: {
    marginRight: 7,
  },
  iconRight: {
    marginLeft: 7,
  },
});
