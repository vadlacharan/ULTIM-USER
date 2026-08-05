import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface CreditIconProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const CreditIcon: React.FC<CreditIconProps> = ({ size = 22, style }) => {
  return (
    <Image
      source={require('../../icons/coins.png')}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
    />
  );
};
