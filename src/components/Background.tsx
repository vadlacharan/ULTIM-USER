import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/theme';

/**
 * Arena Night backdrop — a single, flat near-black stage. The reference
 * handoff deliberately avoids broad gradients: imagery and orange accents
 * carry the depth instead.
 */
const AppBackgroundComponent: React.FC = () => (
  <View pointerEvents="none" style={styles.base} />
);

export const AppBackground = React.memo(AppBackgroundComponent);

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
});
