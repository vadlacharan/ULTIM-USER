import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import { FONTS } from '../../src/theme/theme';

const { width } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish: () => void;
}

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onFinish }) => {
  // Marquee starts from 0 (left edge) and scrolls left continuously
  const marqueeX = useRef(new Animated.Value(0)).current;

  // Screen fades out at the end
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start marquee immediately — infinite loop, no delay
    Animated.loop(
      Animated.timing(marqueeX, {
        toValue: -width,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // After 2.5s, fade the whole splash out and hand off
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* ULTIM — fully visible from frame 1, no animation */}
      <Animated.Text style={styles.ultim}>ULTIM</Animated.Text>

      {/* FOR ALL ribbon — fully visible from frame 1, marquee scrolls immediately */}
      <View style={styles.ribbonWrapper}>
        <View style={styles.ribbon}>
          {/* Duplicate text so the loop is seamless */}
          <Animated.Text
            style={[styles.ribbonText, { transform: [{ translateX: marqueeX }] }]}
          >
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
    backgroundColor: '#050506',
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
