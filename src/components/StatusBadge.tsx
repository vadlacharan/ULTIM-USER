import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/theme';

interface StatusBadgeProps {
  label: string;
  type?: 'active' | 'upcoming' | 'ongoing' | 'past' | 'notice' | 'teal';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type = 'active' }) => {
  let bgColor = 'rgba(255, 90, 31, 0.14)';
  let textColor = COLORS.primary;

  if (type === 'ongoing' || type === 'active') {
    bgColor = 'rgba(255, 138, 80, 0.16)';
    textColor = COLORS.secondary;
  } else if (type === 'past') {
    bgColor = COLORS.glassHigh;
    textColor = COLORS.textMuted;
  } else if (type === 'notice') {
    bgColor = 'rgba(255, 164, 43, 0.12)';
    textColor = COLORS.tertiary;
  } else if (type === 'teal') {
    bgColor = COLORS.successContainer;
    textColor = COLORS.success;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
});
