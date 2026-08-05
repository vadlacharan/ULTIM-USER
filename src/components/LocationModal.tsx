import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { GradientButton, IconButton } from './buttons';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ visible, onClose }) => {
  const { currentLocation, setCurrentLocation } = useApp();
  const [searchInput, setSearchInput] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const presetDistricts = [
    'Hyderabad',
    'Downtown District',
    'Westside Avenue',
    'Northside Park',
    'Bayside Boulevard',
    'Gachibowli Sports Hub',
    'Jubilee Hills',
  ];

  const handleSelectLocation = (locName: string) => {
    setCurrentLocation(locName);
    onClose();
  };

  const handleApplyCustomSearch = () => {
    if (searchInput.trim().length > 0) {
      setCurrentLocation(searchInput.trim());
      onClose();
    }
  };

  const handleUseGPS = async () => {
    try {
      setIsLocating(true);
      // Native OS Permission Request Dialog
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Denied',
          'Permission to access location was denied. Please select a city or district manually.'
        );
        setIsLocating(false);
        return;
      }

      // Fetch position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (position?.coords) {
        const { latitude, longitude } = position.coords;
        const nearLngLat = `${longitude},${latitude}`;
        
        // Reverse Geocode to get city or area name
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          const detectedCity = place.city || place.subregion || place.district || `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
          setCurrentLocation(detectedCity, nearLngLat, { latitude, longitude });
        } else {
          setCurrentLocation(`${latitude.toFixed(4)},${longitude.toFixed(4)}`, nearLngLat, { latitude, longitude });
        }
        onClose();
      }
    } catch (err: any) {
      console.log('[GPS Error]', err);
      Alert.alert('GPS Location Error', 'Unable to fetch current GPS coordinates. Please select your city manually.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Choose Location</Text>
              <Text style={styles.modalSubTitle}>
                Filter sports & fitness centers near you
              </Text>
            </View>
            <IconButton
              icon="close"
              onPress={onClose}
              size={36}
              iconSize={22}
              iconColor={COLORS.onSurface}
              backgroundColor={COLORS.surfaceLow}
            />
          </View>

          {/* Search Input Box */}
          <View style={styles.inputContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search city, neighborhood, or zip..."
              placeholderTextColor={COLORS.textMuted}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleApplyCustomSearch}
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <GradientButton label="APPLY" onPress={handleApplyCustomSearch} compact />
            )}
          </View>

          {/* Native GPS Prompt Button */}
          <GradientButton
            label="USE CURRENT GPS LOCATION"
            icon="navigate-circle-sharp"
            onPress={handleUseGPS}
            loading={isLocating}
            fullWidth
            style={styles.gpsBtn}
          />

          {/* Preset Popular Districts */}
          <Text style={styles.sectionTitle}>POPULAR AREAS & CITIES</Text>
          <ScrollView style={styles.presetList} showsVerticalScrollIndicator={false}>
            {presetDistricts.map((district) => {
              const isSelected = currentLocation === district;
              return (
                <TouchableOpacity
                  key={district}
                  style={[styles.districtItem, isSelected && styles.selectedDistrictItem]}
                  onPress={() => handleSelectLocation(district)}
                >
                  <Ionicons
                    name={isSelected ? 'location-sharp' : 'location-outline'}
                    size={18}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.districtText, isSelected && styles.selectedDistrictText]}>
                    {district}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-sharp" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
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
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.containerPadding,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
    lineHeight: 26,
    color: COLORS.onSurface,
  },
  modalSubTitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLow,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    marginBottom: SPACING.sm,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 14,
  },
  gpsBtn: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetList: {
    maxHeight: 220,
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  selectedDistrictItem: {
    backgroundColor: 'rgba(255, 87, 34, 0.12)',
  },
  districtText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.onSurface,
    marginLeft: 10,
  },
  selectedDistrictText: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
});
