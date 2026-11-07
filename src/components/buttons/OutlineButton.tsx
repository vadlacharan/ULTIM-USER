import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../theme/theme';
import { AnimatedPressable } from './AnimatedPressable';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  icon?: IoniconName;
  iconPosition?: 'left' | 'right';
  /** Accent used for border, text and icon — defaults to the app's primary orange. */
  color: string;
  /** Background tint behind the border. Arena outline buttons stay transparent. */
  tintColor?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Secondary arena action: a hairline outlined block. It sits one step below
 * the solid orange primary CTA and keeps the same 14px geometry.
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
  const isNeutral = color === COLORS.paper || color === COLORS.onSurface;
  const borderColor = isNeutral ? COLORS.line : `${color}99`;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.975}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <View
        style={[
          styles.base,
          compact ? styles.compact : styles.regular,
          fullWidth && styles.fullWidth,
          { backgroundColor: tintColor ?? 'transparent', borderColor },
        ]}
      >
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={compact ? 13 : 15} color={color} style={styles.iconLeft} />
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
          <Ionicons name={icon} size={compact ? 13 : 15} color={color} style={styles.iconRight} />
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
    minHeight: 50,
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
    fontSize: 11,
    letterSpacing: 0.55,
  },
  textCompact: {
    fontSize: 9.5,
    letterSpacing: 0.45,
  },
  iconLeft: {
    marginRight: 7,
  },
  iconRight: {
    marginLeft: 7,
  },
});
