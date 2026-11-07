import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme/theme';

export const TAB_BAR_HEIGHT = 64;

/** Distance from the bottom edge to the top of the safe-area inset. */
export const useTabBarBottomOffset = () => {
  const insets = useSafeAreaInsets();
  return insets.bottom;
};

/** Reserve this much bottom padding in scroll content so the bar never covers items. */
export const useTabBarClearance = () => {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + 20;
};

const ICONS: Record<string, { active: any; inactive: any; label: string }> = {
  HomeTab: { active: 'home', inactive: 'home-outline', label: 'Home' },
  AccessTab: { active: 'ticket', inactive: 'ticket-outline', label: 'Access' },
  BookingsTab: { active: 'calendar', inactive: 'calendar-outline', label: 'Bookings' },
  ProfileTab: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

const TabButton: React.FC<{
  focused: boolean;
  label: string;
  icon: any;
  onPress: () => void;
  onLongPress: () => void;
}> = React.memo(({ focused, label, icon, onPress, onLongPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={focused ? { selected: true } : {}}
    accessibilityLabel={label}
    onPress={onPress}
    onLongPress={onLongPress}
    style={({ pressed }) => [
      styles.tab,
      pressed && { opacity: 0.72 },
    ]}
  >
    {focused && <View style={styles.activeBar} />}
    <Ionicons
      name={icon}
      size={21}
      color={focused ? COLORS.primary : COLORS.meta}
    />
    <Text style={[styles.label, { color: focused ? COLORS.paper : COLORS.meta }]}>
      {label}
    </Text>
  </Pressable>
));

export const BlurTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const icons = ICONS[route.name] || ICONS.HomeTab;
        const label = icons.label;

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
          <TabButton
            key={route.key}
            focused={focused}
            label={label}
            icon={focused ? icons.active : icons.inactive}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
    paddingBottom: 4,
    borderRadius: 12,
  },
  activeBar: {
    position: 'absolute',
    top: -1,
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.primary,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
  },
});
