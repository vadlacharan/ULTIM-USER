import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../theme/theme';

/**
 * The app-wide "Ember on Black" backdrop: a vertical near-black wash with a
 * warm ember glow bleeding in from the top-right and a faint one bottom-left.
 *
 * Deliberately built from plain LinearGradients (no SVG) — SVG radial
 * gradients get rasterized on every screen mount, which shows up as janky
 * page transitions on Android.
 */
const AppBackgroundComponent: React.FC = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <LinearGradient
        colors={[...GRADIENTS.screen]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ember glow — top-right */}
      <LinearGradient
        colors={['rgba(255,90,31,0.28)', 'rgba(255,90,31,0.08)', 'rgba(255,90,31,0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Faint ember wash — bottom-left */}
      <LinearGradient
        colors={['rgba(255,90,31,0.10)', 'rgba(255,90,31,0)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.7, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

export const AppBackground = React.memo(AppBackgroundComponent);

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
});
