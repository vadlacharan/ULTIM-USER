import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FONTS, MOTION, RADIUS } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { GlassBlur, IS_EXPO_GO } from '../components/Blur';

export const TAB_BAR_HEIGHT = 64;

/** Distance the floating bar sits above the bottom edge of the screen. */
export const useTabBarBottomOffset = () => {
  const insets = useSafeAreaInsets();
  return insets.bottom > 0 ? insets.bottom + 6 : 20;
};

/** Reserve this much bottom padding in scroll content so the bar never covers items. */
export const useTabBarClearance = () => {
  const offset = useTabBarBottomOffset();
  return TAB_BAR_HEIGHT + offset + 18;
};

const ICONS: Record<string, { active: any; inactive: any }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  AccessTab: { active: 'flash', inactive: 'flash-outline' },
  BookingsTab: { active: 'calendar', inactive: 'calendar-outline' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

const INDICATOR_INSET_X = 7;
const INDICATOR_INSET_Y = 6;

const AnimatedPressableTab: React.FC<{
  focused: boolean;
  label: string;
  icon: any;
  color: string;
  onPress: () => void;
  onLongPress: () => void;
}> = React.memo(({ focused, label, icon, color, onPress, onLongPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tab, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={label}
        onPressIn={() => {
          scale.value = withTiming(0.88, { duration: MOTION.durationFast });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, MOTION.springSoft);
        }}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabInner}
      >
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.labelText, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

export const BlurTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors } = useApp();
  const bottomOffset = useTabBarBottomOffset();
  const [barWidth, setBarWidth] = useState(0);

  // UI-thread spring: indicator chases the active index without JS round-trips.
  const progress = useSharedValue(state.index);

  useEffect(() => {
    progress.value = withSpring(state.index, MOTION.springSoft);
  }, [state.index]);

  const tabWidth = barWidth / Math.max(state.routes.length, 1);
  const indicatorWidth = Math.max(tabWidth - INDICATOR_INSET_X * 2, 0);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth,
    transform: [{ translateX: progress.value * tabWidth }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View style={[styles.barShadow, { height: TAB_BAR_HEIGHT }]}>
        <View
          style={[styles.bar, { borderColor: 'rgba(255,255,255,0.12)' }]}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        >
          <GlassBlur style={StyleSheet.absoluteFill} blurAmount={24} />
          <LinearGradient
            colors={
              IS_EXPO_GO
                ? ['rgba(16,16,18,0.80)', 'rgba(6,6,8,0.92)']
                : ['rgba(14,14,16,0.10)', 'rgba(5,5,6,0.20)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Sliding active pill — UI-thread spring, no re-render per frame */}
          {barWidth > 0 && (
            <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
          )}

          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const icons = ICONS[route.name] || ICONS.HomeTab;
            const color = focused ? colors.primary : colors.textMuted;
            const label =
              (route as any).options?.tabBarLabel ?? route.name.replace('Tab', '').toUpperCase();

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <AnimatedPressableTab
                key={route.key}
                focused={focused}
                label={String(label)}
                icon={focused ? icons.active : icons.inactive}
                color={color}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 14,
  },
  barShadow: {
    borderRadius: RADIUS.full,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth + 0.7,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET_Y,
    bottom: INDICATOR_INSET_Y,
    left: INDICATOR_INSET_X,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,90,31,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,90,31,0.40)',
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
    height: '100%',
    paddingVertical: 6,
  },
  labelText: {
    fontSize: 8.5,
    fontFamily: FONTS.extraBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
