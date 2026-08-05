import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS } from '../../theme/theme';
import { AnimatedPressable } from './AnimatedPressable';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps {
  icon: IoniconName;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  /** Solid gradient fill (e.g. brand orange arrow chips, back buttons on hero images). */
  gradientColors?: readonly [string, string];
  /** Flat background instead of a gradient. */
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Circular icon-only button (arrow chips, back buttons, close buttons,
 * theme toggles) with the same press-scale feedback as the other buttons.
 * Pass either `gradientColors` for a filled gradient chip, or
 * `backgroundColor`/`borderColor` for a flat/outlined circle.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 34,
  iconSize,
  iconColor = '#FFF',
  gradientColors,
  backgroundColor = 'transparent',
  borderColor,
  disabled = false,
  style,
}) => {
  const resolvedIconSize = iconSize ?? Math.round(size * 0.44);
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const content = <Ionicons name={icon} size={resolvedIconSize} color={iconColor} />;

  return (
    <AnimatedPressable onPress={onPress} disabled={disabled} scaleTo={0.88} style={style}>
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, circleStyle]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.base,
            circleStyle,
            { backgroundColor, borderColor, borderWidth: borderColor ? 1 : 0 },
          ]}
        >
          {content}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
