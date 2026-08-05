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
          backgroundColor: 'rgba(255, 87, 34, 0.08)',
          borderColor: 'rgba(255, 87, 34, 0.3)',
        },
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
      </View>
      <Text style={[styles.text, { color: colors.onSurface }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  iconBox: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
    lineHeight: 19,
  },
});
