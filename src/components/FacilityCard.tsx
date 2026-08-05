import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { Facility } from '../types';
import { IconButton } from './buttons';

const CARD_WIDTH = Dimensions.get('window').width - SPACING.containerPadding * 2;

interface FacilityCardProps {
  facility: Facility;
  onPress: () => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onPress }) => {
  const { colors } = useApp();
  const images = facility.images && facility.images.length > 0
    ? facility.images
    : facility.imageUrl
      ? [facility.imageUrl]
      : [];

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Autoplay carousel every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIdx((prevIdx) => {
        const nextIdx = (prevIdx + 1) % images.length;
        scrollViewRef.current?.scrollTo({ x: nextIdx * CARD_WIDTH, animated: true });
        return nextIdx;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.surfaceHigh }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* ─── IMAGE AREA ─── */}
      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                const w = e.nativeEvent.layoutMeasurement.width;
                const page = Math.round(x / (w || 1));
                if (page !== activeImageIdx && page >= 0 && page < images.length) {
                  setActiveImageIdx(page);
                }
              }}
              scrollEventThrottle={16}
            >
              {images.map((imgUri, index) => (
                <View key={`${imgUri}-${index}`} style={styles.carouselSlide}>
                  <Image source={{ uri: imgUri }} style={styles.image} resizeMode="cover" />
                  {/* Bottom scrim for text legibility */}
                  <View style={styles.scrim} />
                </View>
              ))}
            </ScrollView>

            {/* Pill pagination dots */}
            {images.length > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.dot, activeImageIdx === idx && styles.activeDot]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={36} color={colors.surfaceHigh} />
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>NO PHOTO</Text>
          </View>
        )}

        {/* ── Top-left: Distance chip ── */}
        {facility.distance && facility.distance !== 'Distance N/A' && (
          <View style={styles.distanceBadge}>

            <Text style={styles.distanceText}>{facility.distance}</Text>
          </View>
        )}

        {/* ── Top-right: Rating chip ── */}
        {facility.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.ratingText}>{facility.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* ─── CONTENT AREA ─── */}
      <View style={styles.contentContainer}>
        {/* Name + Category row */}
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
            {facility.name}
          </Text>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{facility.category.toUpperCase()}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={1}>
            {facility.address}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.surfaceHigh }]} />

        {/* Sport tags + arrow */}
        <View style={styles.bottomRow}>
          {facility.sportTags && facility.sportTags.length > 0 ? (
            <View style={styles.tagRow}>
              {facility.sportTags.slice(0, 3).map((tag, i) => (
                <View
                  key={i}
                  style={[
                    styles.tag,
                    { backgroundColor: colors.surfaceLow, borderColor: colors.surfaceHigh },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag.toLocaleUpperCase()}</Text>
                </View>
              ))}
              {facility.sportTags.length > 3 && (
                <Text style={[styles.moreTags, { color: colors.textMuted }]}>
                  +{facility.sportTags.length - 3}
                </Text>
              )}
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <IconButton
            icon="arrow-forward"
            onPress={onPress}
            size={30}
            iconSize={14}
            gradientColors={['#FF8A50', '#FF5722']}
            style={styles.arrowBtnWrapper}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  // ── Image ──
  imageContainer: {
    height: 200,
    width: '100%',
    backgroundColor: COLORS.surfaceLow,
    position: 'relative',
  },
  carouselSlide: {
    width: CARD_WIDTH,
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    // Subtle bottom scrim only
    backgroundColor: 'transparent',
    // Simulate gradient with bottom-heavy overlay
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 18,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.surfaceHigh,
    letterSpacing: 0.5,
  },

  // ── Overlay badges ──
  distanceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19,19,18,0.75)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,87,34,0.3)',
  },
  distanceText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.3,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19,19,18,0.75)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 11,
    fontFamily: FONTS.bold,
  },

  // ── Content ──
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 17,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  categoryChip: {

    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  address: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceHigh,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  tagText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  moreTags: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  arrowBtnWrapper: {
    marginLeft: 8,
  },
});
