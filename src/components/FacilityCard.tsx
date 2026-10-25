import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getActivityIcon } from '../utils/activityIcons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../theme/theme';
import { Facility } from '../types';
import { AnimatedPressable } from './buttons/AnimatedPressable';

interface FacilityCardProps {
  facility: Facility;
  onPress: () => void;
  /** Fixed width for horizontal rails; omit for fluid width in grids/lists. */
  width?: number;
  /** Cover aspect ratio (w/h). Defaults to 16/10. */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
  /** Stagger index for entrance animation — pass from FlatList renderItem. */
  index?: number;
}

/**
 * Spotify playlist-card archetype:
 * - Solid `#181818` elevated container with a padded, framed cover image
 *   (6px inner radius) so the photo pops with a clean margin instead of
 *   bleeding edge-to-edge into text.
 * - Floating circular ember action button (40px, 50% radius) anchored at the
 *   bottom-right of the cover — direct nod to Spotify's circular play CTA.
 * - Crisp white title + silver metadata row + activity tags below on the
 *   dark `#181818` surface.
 */
const FacilityCardComponent: React.FC<FacilityCardProps> = ({
  facility,
  onPress,
  width,
  aspectRatio = 16 / 10,
  style,
  index = 0,
}) => {
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  const imageUri =
    facility.images && facility.images.length > 0
      ? facility.images[0]
      : facility.imageUrl || '';

  const showImage = !!imageUri && !imgFailed;
  const sportPills = (facility.sportTags || []).slice(0, 3);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 45)
        .duration(320)
        .damping(24)
        .stiffness(260)}
    >
      <AnimatedPressable
        onPress={onPress}
        scaleTo={0.97}
        style={[
          styles.card,
          width ? { width, marginRight: 14 } : styles.fluid,
          style,
        ]}
      >
        {/* ─── FRAMED ALBUM COVER ─── */}
        <View style={[styles.coverWrap, { aspectRatio }]}>
          {showImage ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={180}
              cachePolicy="memory-disk"
              recyclingKey={facility.id}
              onError={() => setImgFailed(true)}
              placeholder={{ blurhash: 'L5H2EC=00%M00%M%M9F~q%M%M%M' }}
            />
          ) : (
            <LinearGradient
              colors={['#26262C', '#18181C']}
              style={styles.placeholder}
            >
              <MaterialCommunityIcons
                name={getActivityIcon(facility.category)}
                size={36}
                color="rgba(255,90,31,0.45)"
              />
            </LinearGradient>
          )}

          {/* Subtle top/bottom vignette for badge contrast */}
          <LinearGradient
            colors={['rgba(0,0,0,0.42)', 'transparent', 'rgba(0,0,0,0.55)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Top-left: category pill */}
          <View style={styles.topRow}>
            <View style={styles.categoryChip}>
              <MaterialCommunityIcons
                name={getActivityIcon(facility.category)}
                size={11}
                color={COLORS.primary}
              />
              <Text style={styles.categoryChipText} numberOfLines={1}>
                {(facility.category || 'CENTER').toUpperCase()}
              </Text>
            </View>

            {facility.rating > 0 && (
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={10} color="#FFB800" />
                <Text style={styles.ratingChipText}>{facility.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Bottom-left: distance pill */}
          {facility.distance && facility.distance !== 'Distance N/A' && (
            <View style={styles.distancePill}>
              <Ionicons name="navigate" size={9} color={COLORS.primary} />
              <Text style={styles.distancePillText}>{facility.distance}</Text>
            </View>
          )}

          {/* Bottom-right: Spotify-style circular ember action button */}
          <View style={styles.playFab}>
            <Ionicons name="arrow-forward-sharp" size={17} color={COLORS.onPrimary} style={styles.fabIcon} />
          </View>
        </View>

        {/* ─── SOLID #181818 META TRAY ─── */}
        <View style={styles.metaTray}>
          <Text style={styles.name} numberOfLines={1}>
            {facility.name}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.address} numberOfLines={1}>
              {facility.address}
            </Text>
          </View>

          {sportPills.length > 0 && (
            <View style={styles.tagsRow}>
              {sportPills.map((tag, i) => (
                <View key={`${tag}-${i}`} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const propsEqual = (prev: FacilityCardProps, next: FacilityCardProps) =>
  prev.facility.id === next.facility.id &&
  prev.facility.name === next.facility.name &&
  prev.facility.address === next.facility.address &&
  prev.facility.distance === next.facility.distance &&
  prev.facility.rating === next.facility.rating &&
  prev.width === next.width &&
  prev.index === next.index;

export const FacilityCard = React.memo(FacilityCardComponent, propsEqual);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...SHADOWS.card,
  },
  fluid: {
    flex: 1,
  },
  coverWrap: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222226',
    position: 'relative',
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
  topRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18,18,18,0.86)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  categoryChipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.1,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(18,18,18,0.86)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  ratingChipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: FONTS.bold,
  },
  distancePill: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18,18,18,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,90,31,0.45)',
  },
  distancePillText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
  },
  playFab: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  fabIcon: {
    transform: [{ rotate: '-45deg' }],
  },
  metaTray: {
    paddingTop: 10,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  address: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  tagPill: {
    backgroundColor: '#252525',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tagPillText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#CBCBCB',
    letterSpacing: 0.8,
  },
});
