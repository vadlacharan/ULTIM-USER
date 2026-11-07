import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../../theme/theme';
import { AnimatedPressable } from './AnimatedPressable';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type GradientButtonVariant = 'primary' | 'danger' | 'dark' | 'success';

const VARIANT_COLORS: Record<GradientButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: COLORS.primary, fg: COLORS.onPrimary, border: COLORS.primary },
  danger: { bg: 'rgba(243,114,127,0.12)', fg: COLORS.error, border: 'rgba(243,114,127,0.4)' },
  dark: { bg: COLORS.surfaceBright, fg: COLORS.paper, border: COLORS.line },
  success: { bg: COLORS.success, fg: COLORS.onPrimary, border: COLORS.success },
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
  /** Smaller padding/font for inline CTAs. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Primary arena call-to-action. The reference uses flat, confident orange
 * blocks with a 14px radius rather than gradients — keep that contract.
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
  const palette = VARIANT_COLORS[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.975}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <View
        style={[
          styles.base,
          compact ? styles.compact : styles.regular,
          fullWidth && styles.fullWidth,
          { backgroundColor: palette.bg, borderColor: palette.border },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.fg} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons name={icon} size={compact ? 14 : 16} color={palette.fg} style={styles.iconLeft} />
            )}
            <Text
              style={[
                styles.text,
                compact ? styles.textCompact : styles.textRegular,
                { color: palette.fg },
                textStyle,
              ]}
            >
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons name={icon} size={compact ? 14 : 16} color={palette.fg} style={styles.iconRight} />
            )}
          </>
        )}
      </View>
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
    borderRadius: 14,
    borderWidth: 1,
  },
  regular: {
    minHeight: 52,
    paddingHorizontal: 22,
  },
  compact: {
    minHeight: 38,
    paddingHorizontal: 14,
  },
  text: {
    fontFamily: FONTS.extraBold,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  textRegular: {
    fontSize: 12,
    letterSpacing: 0.55,
  },
  textCompact: {
    fontSize: 10,
    letterSpacing: 0.45,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
