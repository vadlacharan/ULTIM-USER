import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
  FadeOut,
} from 'react-native-reanimated';
import { FONTS } from '../../src/theme/theme';

const { width } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish: () => void;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish }) => {
  // Marquee runs on the UI thread — zero JS load during the most critical
  // first-paint window.
  const marqueeX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const marqueeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: marqueeX.value }],
  }));
  const screenStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    marqueeX.value = withRepeat(
      withTiming(-width, { duration: 2600, easing: Easing.linear }),
      -1,
      false
    );

    const timer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: 350, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onFinish)();
        }
      );
    }, 2100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, screenStyle]} exiting={FadeOut.duration(300)}>
      {/* ULTIM — fully visible from frame 1, no animation */}
      <View style={styles.logoRow}>
        <View style={styles.bars}>
          <View style={styles.bar} />
          <View style={[styles.bar, styles.barShort]} />
        </View>
        <Animated.Text style={styles.ultim}>ULTIM</Animated.Text>
      </View>

      {/* FOR ALL ribbon — marquee scrolls on UI thread */}
      <View style={styles.ribbonWrapper}>
        <View style={styles.ribbon}>
          <Animated.Text style={[styles.ribbonText, marqueeStyle]}>
            {'FOR ALL  ·  FOR ALL  ·  FOR ALL  ·  FOR ALL  ·  FOR ALL  ·  FOR ALL  ·  FOR ALL  ·  '}
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0B0D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 78,
  },
  bar: {
    width: 11,
    height: 72,
    backgroundColor: '#FF6A1A',
    transform: [{ skewX: '-16deg' }],
  },
  barShort: {
    height: 48,
    opacity: 0.72,
  },
  ultim: {
    fontSize: 100,
    fontFamily: FONTS.displayBold,
    color: '#F6F2EA',
    letterSpacing: 6,
  },
  ribbonWrapper: {
    marginTop: 24,
    width: '100%',
    overflow: 'hidden',
  },
  ribbon: {
    backgroundColor: '#FF6A1A',
    paddingVertical: 12,
    overflow: 'hidden',
  },
  ribbonText: {
    fontSize: 17,
    fontFamily: FONTS.extraBold,
    color: '#0A0B0D',
    letterSpacing: 2,
    textTransform: 'uppercase',
    width: width * 5,
  },
});
