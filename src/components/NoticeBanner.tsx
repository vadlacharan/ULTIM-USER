import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';

interface NoticeBannerProps {
  message?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  message = 'Activation Required: Visit center to get access & activate membership',
}) => {
  const { colors } = useApp();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'rgba(255, 90, 31, 0.08)',
        },
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
      </View>
      <Text style={[styles.text, { color: colors.onSurface }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 90, 31, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginVertical: SPACING.sm,
  },
  iconBox: {
    marginRight: 9,
  },
  text: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
});
