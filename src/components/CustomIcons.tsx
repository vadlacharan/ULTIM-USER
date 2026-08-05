import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface IconProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const LocationIcon: React.FC<IconProps> = ({ size = 20, style }) => (
  <Image
    source={require('../../icons/location.png')}
    style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
  />
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 20, style }) => (
  <Image
    source={require('../../icons/calendar.png')}
    style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
  />
);

export const TimeIcon: React.FC<IconProps> = ({ size = 20, style }) => (
  <Image
    source={require('../../icons/time.png')}
    style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
  />
);
