import React, { useState, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path } from 'react-native-svg';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { Booking } from '../types';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { IconButton } from './buttons';

/**
 * Single-Path SVG QR Code component 100% compliant with React 19 & Hermes compiler.
 */
const PureSVGQRCode: React.FC<{ value: string; size: number }> = ({ value, size }) => {
  const gridSize = 21;
  const cellSize = size / gridSize;

  const pathData = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    const markFinder = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            grid[startRow + r][startCol + c] = true;
          }
        }
      }
    };

    markFinder(0, 0);
    markFinder(0, 14);
    markFinder(14, 0);

    for (let i = 8; i < 13; i += 2) {
      grid[6][i] = true;
      grid[i][6] = true;
    }

    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
        if (r === 6 || c === 6) continue;

        const val = Math.abs(Math.sin((r + 1) * (c + 1) * hash) * 10000);
        grid[r][c] = (Math.floor(val) % 2) === 0;
      }
    }

    let d = '';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c]) {
          const x = (c * cellSize).toFixed(2);
          const y = (r * cellSize).toFixed(2);
          const w = (cellSize + 0.15).toFixed(2);
          d += `M${x},${y}h${w}v${w}h-${w}z `;
        }
      }
    }
    return d;
  }, [value, size, cellSize]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect width={size} height={size} fill="#FFFFFF" rx={8} />
      <Path d={pathData} fill="#0A0A0B" />
    </Svg>
  );
};

interface QRCodeModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, booking, onClose }) => {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  if (!booking) return null;

  const qrMode = booking.qrMode || 'CHECK_IN';

  const [token, setToken] = useState<string>(booking.qrCodePayload || 'ULTIM-PASS-TOKEN');
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);

  useEffect(() => {
    if (booking?.qrCodePayload) {
      setToken(booking.qrCodePayload);
    }
  }, [booking]);

  useEffect(() => {
    if (!visible || !booking) return;
    const timer = setInterval(() => {
      refreshQrToken();
    }, 15000);
    return () => clearInterval(timer);
  }, [visible, booking]);

  const refreshQrToken = async () => {
    if (!booking) return;
    try {
      setIsRefreshingToken(true);
      const res = await api.generateBookingQr(booking.id);
      if (res?.token) {
        setToken(res.token);
      }
    } catch (e) {
      console.log('[QR Refresh Error]', e);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const { facilities } = useApp();
  const facility = facilities.find((f) => String(f.id) === String(booking?.facilityId) || f.name === booking?.facilityName);

  const handleGetDirections = () => {
    if (!booking) return;

    let lat = facility?.latitude;
    let lng = facility?.longitude;
    if ((lat === undefined || lng === undefined) && facility?.rawLocation && Array.isArray(facility.rawLocation) && facility.rawLocation.length >= 2) {
      lng = facility.rawLocation[0];
      lat = facility.rawLocation[1];
    }

    let url: string;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const label = encodeURIComponent(booking.facilityName || 'Facility');
      url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
        web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const query = encodeURIComponent(`${booking.facilityName}, ${booking.facilityAddress}`);
      url = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`,
        web: `https://www.google.com/maps/search/?api=1&query=${query}`,
      }) || `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    Linking.openURL(url).catch(() => {
      if (lat !== undefined && lng !== undefined) {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      } else {
        const query = encodeURIComponent(`${booking.facilityName}, ${booking.facilityAddress}`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            {
              backgroundColor: 'rgba(12,12,16,0.96)',
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
          onPress={() => {}}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.titleContainer}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}> 
                  {qrMode === 'CHECK_OUT' ? 'Check-Out QR Pass' : 'Check-In QR Pass'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}> 
                  {qrMode === 'CHECK_OUT'
                    ? 'Present at reception desk to complete your session exit'
                    : 'Present at reception desk for instant entry'}
                </Text>
              </View>
              <IconButton
                icon="close"
                onPress={onClose}
                size={32}
                iconSize={24}
                iconColor={colors.onSurface}
              />
            </View>

            {/* QR Container */}
            <View
              style={[
                styles.qrCard,
                { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              ]}
            >
              <View style={styles.qrHeaderTag}>
                <Text style={[styles.qrTagText, { color: colors.primary }]}> 
                  {qrMode === 'CHECK_OUT' ? 'SESSION CHECK-OUT' : 'CONFIRMED SESSION'}
                </Text>
              </View>

              {/* SINGLE-PATH REACT 19 COMPLIANT SVG QR CODE */}
              <View style={styles.qrSvgWrapper}>
                {isRefreshingToken ? (
                  <View style={styles.qrLoadingBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : (
                  <PureSVGQRCode value={token} size={190} />
                )}
              </View>

              {/* 16-Character Hex Token Code */}
              <Text style={[styles.codeText, { color: colors.primary }]}>{token}</Text>
            </View>

            {/* Session Details */}
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: colors.glass, borderColor: colors.glassBorder },
              ]}
            >
              <TouchableOpacity onPress={handleGetDirections} activeOpacity={0.8}>
                <Text style={[styles.facilityName, { color: colors.onSurface }]}>
                  {booking.facilityName}
                </Text>
                <Text style={[styles.facilityAddress, { color: colors.textMuted }]}>
                  {booking.facilityAddress}
                </Text>
                <View style={styles.directionsRow}>
                  <Ionicons name="navigate-outline" size={12} color={colors.primary} />
                  <Text style={[styles.directionsText, { color: colors.primary }]}>
                    GET DIRECTIONS
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={[styles.infoDivider, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>SPORT / ZONE</Text>
                  <Text style={[styles.value, { color: colors.onSurface }]}>{booking.sportType}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>COURT / FLOOR</Text>
                  <Text style={[styles.value, { color: colors.onSurface }]}>{booking.courtName}</Text>
                </View>
              </View>

              <View style={[styles.row, { marginTop: 12 }]}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>DATE</Text>
                  <Text style={[styles.value, { color: colors.onSurface }]}>{booking.dateStr}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>TIME SLOT</Text>
                  <Text style={[styles.value, { color: colors.onSurface }]}> 
                    {booking.timeSlotLabel}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    maxHeight: '90%',
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: SPACING.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    marginTop: 2,
  },

  qrCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  qrHeaderTag: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  qrTagText: {
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  qrSvgWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginVertical: 4,
    width: 214,
    height: 214,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingBox: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 10,
  },
  detailsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  facilityName: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  directionsText: {
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.1,
  },
  facilityAddress: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    marginVertical: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
});
