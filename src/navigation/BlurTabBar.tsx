import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS } from '../theme/theme';
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

export const BlurTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors } = useApp();
  const bottomOffset = useTabBarBottomOffset();
  const [barWidth, setBarWidth] = useState(0);

  const pressAnims = useRef<Record<string, Animated.Value>>({});
  const slide = useRef(new Animated.Value(state.index)).current;

  // Smooth slide with just a whisper of overshoot.
  useEffect(() => {
    Animated.spring(slide, {
      toValue: state.index,
      stiffness: 260,
      damping: 30,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [state.index, slide]);

  const getPress = (key: string) => {
    if (!pressAnims.current[key]) {
      pressAnims.current[key] = new Animated.Value(0);
    }
    return pressAnims.current[key];
  };

  const pressIn = (key: string) =>
    Animated.timing(getPress(key), {
      toValue: 1,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  const pressOut = (key: string) =>
    Animated.timing(getPress(key), {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  const tabWidth = barWidth / state.routes.length;
  const indicatorWidth = Math.max(tabWidth - INDICATOR_INSET_X * 2, 0);

  const indicatorTranslate = slide.interpolate({
    inputRange: [0, Math.max(state.routes.length - 1, 1)],
    outputRange: [0, Math.max(tabWidth * (state.routes.length - 1), 0)],
    extrapolate: 'clamp',
  });

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View style={[styles.barShadow, { height: TAB_BAR_HEIGHT }]}>
        <View
          style={[
            styles.bar,
            {
              height: TAB_BAR_HEIGHT,
              borderColor: 'rgba(255,255,255,0.12)',
            },
          ]}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        >
          <GlassBlur style={StyleSheet.absoluteFill} blurAmount={30} />
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

          {/* Sliding active pill — behind the tabs, springs between slots */}
          {barWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                {
                  width: indicatorWidth,
                  transform: [{ translateX: indicatorTranslate }],
                },
              ]}
            />
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

            const press = getPress(route.key);

            return (
              <Animated.View
                key={route.key}
                style={[
                  styles.tab,
                  {
                    transform: [
                      {
                        scale: press.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.9],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  accessibilityLabel={label}
                  activeOpacity={1}
                  onPressIn={() => pressIn(route.key)}
                  onPressOut={() => pressOut(route.key)}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabInner}
                >
                  <Ionicons name={focused ? icons.active : icons.inactive} size={20} color={color} />
                  <Text style={[styles.labelText, { color }]} numberOfLines={1}>
                    {String(label)}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
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
    // Intentionally no drop shadow: on a transparent container iOS derives
    // the shadow from each child's alpha, which makes the icons glow.
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
