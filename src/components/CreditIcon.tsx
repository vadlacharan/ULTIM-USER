import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

interface CreditIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Monochrome credit token — an outlined arena-orange disc with a bolt.
 * Replaces the old gold crown coin so credit moments stay on-brand.
 */
export const CreditIcon: React.FC<CreditIconProps> = ({ size = 22, style }) => (
  <View
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(1, size * 0.075),
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
      },
      style,
    ]}
  >
    <Ionicons name="flash" size={Math.round(size * 0.54)} color={COLORS.primary} />
  </View>
);
