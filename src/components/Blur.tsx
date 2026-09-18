import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView, ProgressiveBlurView } from '@sbaiahmed1/react-native-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';

/**
 * Expo Go can't load the custom native blur module, so every glass surface
 * falls back to a layered translucent scrim there (same layout, same reading,
 * no blur). Dev/release builds get the real native effects.
 */
export const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Native material blur where available; no-op in Expo Go (scrim carries it). */
export const GlassBlur: React.FC<{
  style?: StyleProp<ViewStyle>;
  blurAmount?: number;
}> = ({ style, blurAmount = 30 }) => {
  if (IS_EXPO_GO) return null;
  return (
    <BlurView
      blurType="systemUltraThinMaterialDark"
      blurAmount={blurAmount}
      blurRounds={3}
      reducedTransparencyFallbackColor="#101013"
      style={style ?? StyleSheet.absoluteFill}
    />
  );
};

interface ProgressiveBlurProps {
  /** Total height of the blur overlay (including the fade zone). */
  height: number;
  /** Bottom portion of the overlay where the blur dissolves into the background. */
  fadeHeight?: number;
  /** Max blur radius in px at the strongest (top) part of the ramp. */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Progressive (iOS-26-style gradient) blur with a seamless ramp from fully
 * blurred at the top edge to perfectly clear at the bottom — no layers, no
 * seams. Tinted with a whisper of near-black so header content stays legible
 * over the ember gradient background.
 */
export const ProgressiveBlur: React.FC<ProgressiveBlurProps> = ({
  height,
  fadeHeight = 26,
  intensity = 40,
  style,
}) => {
  const solidHeight = Math.max(height - fadeHeight, 8);
  const startOffset = Math.min(Math.max(solidHeight / height, 0), 0.95);

  // The scrim gradient is rendered on both platforms — in Expo Go it IS the
  // header material, and in native builds it sits over a lighter blur so the
  // two versions read the same.
  const scrimColors: [string, string, string, string] = IS_EXPO_GO
    ? [
        'rgba(6,6,8,0.92)',
        'rgba(8,8,10,0.66)',
        'rgba(10,10,12,0.28)',
        'rgba(10,10,12,0)',
      ]
    : [
        'rgba(6,6,8,0.72)',
        'rgba(8,8,10,0.44)',
        'rgba(10,10,12,0.16)',
        'rgba(10,10,12,0)',
      ];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {!IS_EXPO_GO && (
        <ProgressiveBlurView
          blurType="dark"
          blurAmount={intensity}
          blurRounds={3}
          direction="blurredTopClearBottom"
          startOffset={startOffset}
          overlayColor="rgba(8,8,10,0.18)"
          reducedTransparencyFallbackColor="#0B0B0D"
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={scrimColors}
        locations={[0, startOffset * 0.55, startOffset * 0.85, startOffset]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

interface BlurHeaderProps {
  /** Height of the interactive header row (including status-bar padding). */
  height: number;
  /** Height of the blur fade extending below the header row. */
  fadeHeight?: number;
  intensity?: number;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Absolute overlay header — drop it AFTER the scrollable content in the tree
 * so screens scroll *behind* the blur. Give the scroll content a top padding
 * equal to `height` so nothing is permanently hidden.
 */
export const BlurHeader: React.FC<BlurHeaderProps> = ({
  height,
  fadeHeight = 26,
  intensity,
  contentStyle,
  children,
}) => {
  return (
    <View pointerEvents="box-none" style={[styles.shell, { height: height + fadeHeight }]}>
      <ProgressiveBlur
        height={height + fadeHeight}
        fadeHeight={fadeHeight}
        intensity={intensity}
      />
      <View pointerEvents="box-none" style={[{ height }, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

/**
 * Shared metrics for the standard title-bar screens (Access / Bookings /
 * Profile / Notifications). `extraHeight` adds anything below the title row
 * that should also float over the blur (e.g. sub-tabs).
 */
export const useBlurHeaderLayout = (extraHeight = 0) => {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 10) + 2;
  const height = top + 26 + 8 + extraHeight; // paddingTop + title line + bottom pad
  return { top, height };
};

/**
 * Standard big-title header floating on a progressive blur.
 * Pair with `useBlurHeaderLayout()` to inset the screen's scroll content.
 */
export const BlurTitleHeader: React.FC<{ title: React.ReactNode }> = ({ title }) => {
  const { colors } = useApp();
  const { top, height } = useBlurHeaderLayout();

  return (
    <BlurHeader
      height={height}
      contentStyle={{
        paddingTop: top,
        paddingHorizontal: SPACING.containerPadding,
        justifyContent: 'flex-end',
      }}
    >
      <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
        {title}
      </Text>
    </BlurHeader>
  );
};

/** Layout for back-button style bars (IconButton row). */
export const useBlurBackHeaderLayout = () => {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 10) + 2;
  const height = top + 40 + 8;
  return { top, height };
};

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  title: {
    fontSize: 21,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
});
