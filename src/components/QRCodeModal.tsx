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
import QRCode from 'react-native-qrcode-svg';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { Booking } from '../types';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { Eyebrow, RoundIconButton } from './ArenaUI';
import { formatClock, formatDateLong } from '../utils/display';

interface QRCodeModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, booking, onClose }) => {
  const { colors, facilities } = useApp();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState<string>(booking?.qrCodePayload || 'ULTIM-PASS-TOKEN');
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);

  useEffect(() => {
    if (booking?.qrCodePayload) setToken(booking.qrCodePayload);
  }, [booking]);

  useEffect(() => {
    if (!visible || !booking) return;
    const timer = setInterval(() => {
      refreshQrToken();
    }, 15000);
    return () => clearInterval(timer);
  }, [visible, booking]);

  if (!booking) return null;

  const qrMode = booking.qrMode || 'CHECK_IN';
  const facility = facilities.find(
    (f) => String(f.id) === String(booking.facilityId) || f.name === booking.facilityName
  );

  const refreshQrToken = async () => {
    if (!booking) return;
    try {
      setIsRefreshingToken(true);
      const res = await api.generateBookingQr(booking.id);
      if (res?.token) setToken(res.token);
    } catch (e) {
      console.log('[QR Refresh Error]', e);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleGetDirections = () => {
    let lat = facility?.latitude;
    let lng = facility?.longitude;
    if (
      (lat === undefined || lng === undefined) &&
      facility?.rawLocation &&
      Array.isArray(facility.rawLocation) &&
      facility.rawLocation.length >= 2
    ) {
      lng = facility.rawLocation[0];
      lat = facility.rawLocation[1];
    }

    let url: string;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const label = encodeURIComponent(booking.facilityName || 'Facility');
      url =
        Platform.select({
          ios: `maps:0,0?q=${label}@${lat},${lng}`,
          android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
          web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const query = encodeURIComponent(`${booking.facilityName}, ${booking.facilityAddress}`);
      url =
        Platform.select({
          ios: `maps:0,0?q=${query}`,
          android: `geo:0,0?q=${query}`,
          web: `https://www.google.com/maps/search/?api=1&query=${query}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    Linking.openURL(url).catch(() => {
      const query = encodeURIComponent(`${booking.facilityName}, ${booking.facilityAddress}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  const bookingId = `BK-${String(booking.id).slice(-6).toUpperCase()}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(insets.bottom, SPACING.md) },
          ]}
          onPress={() => {}}
        >
          <View style={styles.grabber} />
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.modalHeader}>
              <View style={styles.titleContainer}>
                <Eyebrow>Entry pass</Eyebrow>
                <Text style={styles.modalTitle}>
                  {qrMode === 'CHECK_OUT' ? 'Check-out pass' : 'Booking pass'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {qrMode === 'CHECK_OUT'
                    ? 'Show this at reception to complete your session.'
                    : 'Show this at reception for instant entry.'}
                </Text>
              </View>
              <RoundIconButton icon="close" onPress={onClose} color={COLORS.paper} />
            </View>

            <View style={styles.qrPaper}>
              <View style={styles.qrSvgWrapper}>
                {isRefreshingToken ? (
                  <View style={styles.qrLoadingBox}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                ) : (
                  <QRCode
                    value={token}
                    size={240}
                    color="#0A0B0D"
                    backgroundColor="#FFFFFF"
                    ecl="M"
                    quietZone={10}
                  />
                )}
              </View>
              <Text style={styles.qrCodeLabel}>HEXADECIMAL ENTRY CODE</Text>
              <Text style={styles.codeText}>{token}</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    {qrMode === 'CHECK_OUT' ? 'CHECK-OUT' : 'CONFIRMED'}
                  </Text>
                </View>
                <Text style={styles.bookingId}>{bookingId}</Text>
              </View>

              <Text style={styles.bookingTitle}>
                {(booking.sportType || 'Session').toUpperCase()} · {booking.courtName}
              </Text>

              <TouchableOpacity onPress={handleGetDirections} activeOpacity={0.75}>
                <View style={styles.venueRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.facilityName}>{booking.facilityName}</Text>
                    <Text style={styles.facilityAddress} numberOfLines={2}>
                      {booking.facilityAddress}
                    </Text>
                  </View>
                  <View style={styles.directionChip}>
                    <Ionicons name="navigate-outline" size={14} color={COLORS.primary} />
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.detailsDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Date & time</Text>
                <Text style={styles.detailValue}>
                  {formatDateLong(booking.dateStr)} ·{' '}
                  {(booking.timeSlotLabel || '').match(/^\d{1,2}:\d{2}/)
                    ? formatClock((booking.timeSlotLabel || '').slice(0, 5))
                    : booking.timeSlotLabel}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Session</Text>
                <Text style={styles.detailValue}>{booking.durationMins} minutes</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Credits</Text>
                <Text style={styles.detailValue}>{booking.creditsSpent}</Text>
              </View>

              <Text style={styles.qrNote}>
                {qrMode === 'CHECK_OUT'
                  ? 'Show this pass at reception when you leave.'
                  : 'Show this pass at reception when you arrive.'}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} activeOpacity={0.86} style={styles.doneButton}>
            <Text style={styles.doneText}>DONE</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.74)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    paddingTop: 8,
    paddingHorizontal: SPACING.containerPadding,
    borderTopLeftRadius: RADIUS.panel,
    borderTopRightRadius: RADIUS.panel,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    maxHeight: '92%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
    marginBottom: 16,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: SPACING.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  titleContainer: {
    flex: 1,
  },
  modalTitle: {
    marginTop: 2,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 29,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  modalSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  qrPaper: {
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FFFFFF',
  },
  qrSvgWrapper: {
    width: 198,
    height: 198,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingBox: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeLabel: {
    marginTop: 8,
    color: '#77726A',
    fontFamily: FONTS.extraBold,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1.1,
  },
  codeText: {
    marginTop: 4,
    color: '#0A0B0D',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 1.5,
  },
  detailsCard: {
    gap: 7,
    marginTop: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surfaceBright,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(123,217,154,0.1)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.success,
    fontFamily: FONTS.extraBold,
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  bookingId: {
    color: COLORS.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    letterSpacing: 0.4,
  },
  bookingTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 23,
    marginTop: 1,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  facilityName: {
    color: COLORS.paperDim,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  facilityAddress: {
    marginTop: 1,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 14,
  },
  directionChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryMuted,
  },
  detailsDivider: {
    height: 1,
    marginVertical: 4,
    backgroundColor: COLORS.lineSoft,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailKey: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 14,
  },
  detailValue: {
    flexShrink: 1,
    color: COLORS.paperDim,
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
  },
  qrNote: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 15,
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  doneText: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.extraBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
