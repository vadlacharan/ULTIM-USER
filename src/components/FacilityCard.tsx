import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS } from '../theme/theme';
import { Facility } from '../types';

const FALLBACK_IMAGES: Record<string, any> = {
  Fitness: require('../../assets/arena/category-fitness.jpg'),
  Sports: require('../../assets/arena/category-sports.jpg'),
  Sport: require('../../assets/arena/category-sports.jpg'),
  Health: require('../../assets/arena/category-health.jpg'),
};

interface FacilityCardProps {
  facility: Facility;
  onPress: () => void;
  /** Fixed width for horizontal rails; omit for fluid width in grids/lists. */
  width?: number;
  /** Cover aspect ratio (w/h). Defaults to 4/3. */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
  /** Stagger index for entrance animation — pass from FlatList renderItem. */
  index?: number;
}

/**
 * Arena venue card: photo-led with a 4:3 crop and a quiet editorial meta
 * tray. No enclosing card — the image carries the weight, exactly like the
 * reference handoff.
 */
const FacilityCardComponent: React.FC<FacilityCardProps> = ({
  facility,
  onPress,
  width,
  aspectRatio = 4 / 3,
  style,
  index = 0,
}) => {
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  const imageUri =
    facility.images && facility.images.length > 0
      ? facility.images[0]
      : facility.imageUrl || '';

  const showImage = !!imageUri && !imgFailed;
  const sport = (facility.sportTags && facility.sportTags[0]) || facility.category;
  const openLabel = facility.operatingHours
    ? facility.operatingHours.length > 24
      ? 'Open today'
      : facility.operatingHours
    : 'Open today';

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 45)
        .duration(340)
        .damping(24)
        .stiffness(260)}
      style={[width ? { width, marginRight: 12 } : styles.fluid, style]}
    >
      <View style={styles.card}>
        <Pressable onPress={onPress} style={styles.mediaPress}>
          <View style={[styles.media, { aspectRatio }]}>
            <Image
              source={
                showImage
                  ? { uri: imageUri }
                  : FALLBACK_IMAGES[facility.category] || FALLBACK_IMAGES.Sports
              }
              style={styles.image}
              contentFit="cover"
              transition={220}
              cachePolicy="memory-disk"
              recyclingKey={facility.id}
              onError={() => setImgFailed(true)}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          </View>
        </Pressable>

        <Pressable onPress={onPress} style={styles.info}>
          <View style={styles.topline}>
            <Text style={styles.name} numberOfLines={1}>
              {facility.name}
            </Text>
            {facility.rating > 0 && (
              <View style={styles.rating}>
                <Ionicons name="star" size={11} color={COLORS.primary} />
                <Text style={styles.ratingText}>{facility.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            {sport}
            {facility.distance && facility.distance !== 'Distance N/A'
              ? ` · ${facility.distance}`
              : ''}
          </Text>

          <View style={styles.bottom}>
            <View style={styles.openState}>
              <View style={styles.openDot} />
              <Text style={styles.openText} numberOfLines={1}>
                {openLabel}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
          </View>
        </Pressable>
      </View>
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
  fluid: {
    flex: 1,
  },
  card: {
    position: 'relative',
    minWidth: 0,
  },
  mediaPress: {
    borderRadius: 18,
  },
  media: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceBright,
    borderWidth: 1,
    borderColor: COLORS.lineSoft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  ratingText: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 11,
    lineHeight: 14,
  },
  meta: {
    marginTop: 3,
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  openState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  openText: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
