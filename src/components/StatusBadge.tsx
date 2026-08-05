import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/theme';

interface StatusBadgeProps {
  label: string;
  type?: 'active' | 'upcoming' | 'ongoing' | 'past' | 'notice' | 'teal';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type = 'active' }) => {
  let bgColor = 'rgba(255, 87, 34, 0.15)';
  let textColor = COLORS.primary;
  let borderColor = 'rgba(255, 87, 34, 0.4)';

  if (type === 'ongoing' || type === 'active') {
    bgColor = 'rgba(255, 112, 67, 0.2)';
    textColor = COLORS.secondary;
    borderColor = COLORS.secondary;
  } else if (type === 'past') {
    bgColor = COLORS.surfaceLow;
    textColor = COLORS.textMuted;
    borderColor = COLORS.surfaceHigh;
  } else if (type === 'notice') {
    bgColor = 'rgba(255, 138, 101, 0.15)';
    textColor = COLORS.tertiary;
    borderColor = 'rgba(255, 138, 101, 0.4)';
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
});
