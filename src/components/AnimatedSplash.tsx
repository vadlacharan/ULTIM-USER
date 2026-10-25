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
      <Animated.Text style={styles.ultim}>ULTIM</Animated.Text>

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
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  ultim: {
    fontSize: 96,
    fontFamily: FONTS.black,
    color: '#FFFFFF',
    letterSpacing: 6,
    textShadowColor: 'rgba(255,90,31,0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  ribbonWrapper: {
    marginTop: 24,
    width: '100%',
    overflow: 'hidden',
  },
  ribbon: {
    backgroundColor: '#FF4D12',
    paddingVertical: 12,
    overflow: 'hidden',
  },
  ribbonText: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
    width: width * 5,
  },
});
