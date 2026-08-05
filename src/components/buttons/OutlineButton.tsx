import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS } from '../../theme/theme';
import { AnimatedPressable } from './AnimatedPressable';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  icon?: IoniconName;
  iconPosition?: 'left' | 'right';
  /** Accent used for border, text and icon — defaults to the app's primary orange. */
  color: string;
  /** Background tint behind the border, usually `${color}1A`-style translucent fill. */
  tintColor?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Secondary action button — a soft tinted, bordered pill with the same
 * tactile press animation as `GradientButton` but visually one step down
 * in emphasis. Use for "Cancel", "Retry", "Sign Out", "View Details", etc.
 */
export const OutlineButton: React.FC<OutlineButtonProps> = ({
  label,
  onPress,
  icon,
  iconPosition = 'left',
  color,
  tintColor,
  disabled = false,
  fullWidth = false,
  compact = false,
  style,
  textStyle,
}) => {
  const resolvedTint = tintColor ?? `${color}14`;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <View
        style={[
          styles.base,
          compact ? styles.compact : styles.regular,
          fullWidth && styles.fullWidth,
          { backgroundColor: resolvedTint, borderColor: color },
        ]}
      >
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={compact ? 14 : 16} color={color} style={styles.iconLeft} />
        )}
        <Text
          style={[
            styles.text,
            compact ? styles.textCompact : styles.textRegular,
            { color },
            textStyle,
          ]}
        >
          {label}
        </Text>
        {icon && iconPosition === 'right' && (
          <Ionicons name={icon} size={compact ? 14 : 16} color={color} style={styles.iconRight} />
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
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  regular: {
    paddingVertical: 11.5,
    paddingHorizontal: 20,
  },
  compact: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  text: {
    fontFamily: FONTS.extraBold,
    textAlign: 'center',
  },
  textRegular: {
    fontSize: 13,
    letterSpacing: 0.4,
  },
  textCompact: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  iconLeft: {
    marginRight: 7,
  },
  iconRight: {
    marginLeft: 7,
  },
});
