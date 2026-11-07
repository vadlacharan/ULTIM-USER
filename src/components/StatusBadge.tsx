import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/theme';

interface StatusBadgeProps {
  label: string;
  type?: 'active' | 'upcoming' | 'ongoing' | 'past' | 'notice' | 'teal';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type = 'active' }) => {
  let bgColor = COLORS.primaryMuted;
  let textColor = COLORS.primary;
  let borderColor = COLORS.primaryBorder;

  if (type === 'ongoing' || type === 'active') {
    bgColor = 'rgba(123,217,154,0.10)';
    textColor = COLORS.success;
    borderColor = 'rgba(123,217,154,0.28)';
  } else if (type === 'past') {
    bgColor = 'rgba(255,255,255,0.04)';
    textColor = COLORS.muted;
    borderColor = COLORS.line;
  } else if (type === 'notice') {
    bgColor = 'rgba(255,106,26,0.08)';
    textColor = COLORS.secondary;
    borderColor = COLORS.primaryBorder;
  } else if (type === 'teal') {
    bgColor = COLORS.successContainer;
    textColor = COLORS.success;
    borderColor = 'rgba(123,217,154,0.28)';
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.7,
  },
});
