import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';

/**
 * The app-wide "Ember on Black" backdrop: near-black base with a single warm
 * ember wash bleeding from the top. One gradient layer only — three stacked
 * full-screen gradients were costing a full-screen overdraw on every frame
 * while scrolling on Android.
 */
const AppBackgroundComponent: React.FC = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <LinearGradient
        colors={['#1E100A', '#121212', '#121212']}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ember glow — top anchor only */}
      <LinearGradient
        colors={['rgba(255,90,31,0.22)', 'rgba(255,90,31,0)']}
        locations={[0, 1]}
        start={{ x: 0.85, y: 0 }}
        end={{ x: 0.15, y: 0.55 }}
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
