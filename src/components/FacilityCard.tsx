import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getActivityIcon } from '../utils/activityIcons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { Facility } from '../types';

interface FacilityCardProps {
  facility: Facility;
  onPress: () => void;
  /** Fixed width for horizontal rails; omit for fluid width in grids/lists. */
  width?: number;
  /** Cover aspect ratio (w/h). Defaults to 4/3. */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Media card — cover image with the facility's identity sitting directly
 * under it on the screen background (no gray container), like a music app's
 * song card. Overlay chips carry the only chrome.
 */
export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onPress, width, aspectRatio = 4 / 3, style }) => {
  const { colors } = useApp();
  const [imgLoading, setImgLoading] = useState<boolean>(true);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  const imageUri =
    facility.images && facility.images.length > 0
      ? facility.images[0]
      : facility.imageUrl || '';

  const showImage = !!imageUri && !imgFailed;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        width ? { width, marginRight: 14 } : styles.fluid,
        style,
      ]}
    >
      {/* ─── COVER ─── */}
      <View style={[styles.imageContainer, { aspectRatio }]}>
        {showImage ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onLoadStart={() => setImgLoading(true)}
            onLoadEnd={() => setImgLoading(false)}
            onError={() => {
              setImgFailed(true);
              setImgLoading(false);
            }}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.16)" />
          </View>
        )}

        {/* Thumbnail loading state */}
        {showImage && imgLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
        )}

        {/* Bottom scrim so chips read on any photo */}
        <View style={styles.scrim} />

        {facility.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={9} color="#FFD700" />
            <Text style={styles.ratingText}>{facility.rating.toFixed(1)}</Text>
          </View>
        )}

        {facility.distance && facility.distance !== 'Distance N/A' && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{facility.distance}</Text>
          </View>
        )}
      </View>

      {/* ─── IDENTITY (on the screen background) ─── */}
      <View style={styles.meta}>
        <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
          {facility.name}
        </Text>
        <View style={styles.subRow}>
          <MaterialCommunityIcons
            name={getActivityIcon(facility.category)}
            size={12}
            color={colors.primary}
          />
          <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>
            {facility.category.toUpperCase()}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={1}>
            {facility.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {},
  fluid: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    backgroundColor: COLORS.glassHigh,
    ...SHADOWS.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,12,0.35)',
  },
  loadingSpinner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,5,6,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,6,0.14)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(5,5,6,0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(5,5,6,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,90,31,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  distanceText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
  },
  meta: {
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  category: {
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.9,
    flexShrink: 0,
  },
  dot: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  address: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    flexShrink: 1,
  },
});
