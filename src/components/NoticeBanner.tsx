import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';

interface NoticeBannerProps {
  message?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  message = 'Activation Required: Visit center to get access & activate membership',
}) => (
  <View style={styles.container}>
    <Ionicons name="information-circle-outline" size={17} color={COLORS.primary} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: SPACING.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.primaryMuted,
  },
  text: {
    flex: 1,
    color: COLORS.paperDim,
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
