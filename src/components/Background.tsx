import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { COLORS, GRADIENTS } from '../theme/theme';

/**
 * The app-wide "Ember on Black" backdrop: a vertical near-black wash with a
 * warm ember glow bleeding in from the top-right and a faint one bottom-left.
 * Rendered as the first child of every screen container so content, cards and
 * the progressive-blur headers all sit on top of it.
 */
export const AppBackground: React.FC = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <LinearGradient
        colors={[...GRADIENTS.screen]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="emberTop" cx="85%" cy="-5%" r="80%">
            <Stop offset="0" stopColor={GRADIENTS.ember} stopOpacity={0.30} />
            <Stop offset="0.45" stopColor={GRADIENTS.ember} stopOpacity={0.10} />
            <Stop offset="1" stopColor={GRADIENTS.ember} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="emberBottom" cx="5%" cy="105%" r="65%">
            <Stop offset="0" stopColor={GRADIENTS.ember} stopOpacity={0.10} />
            <Stop offset="1" stopColor={GRADIENTS.ember} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#emberTop)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#emberBottom)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
});
