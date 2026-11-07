import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from './buttons/AnimatedPressable';
import { openStoreListing, type AppUpdateDecision } from '../services/appUpdates';
import { COLORS, FONTS, GRADIENTS, RADIUS } from '../theme/theme';

type UpdateGateProps = {
  decision: AppUpdateDecision;
  onRetry: () => void;
  checking?: boolean;
  /** Optional sheet only — force screen intentionally has no dismiss. */
  onDismiss?: () => void;
};

const releaseNotesFor = (decision: AppUpdateDecision) =>
  (decision.releaseNotes ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•*]\s*/, ''))
    .filter(Boolean);

const versionLabel = (version: string | null, build: number | null) =>
  version ? (build && build > 0 ? `${version} (${build})` : version) : '—';

const VersionRow: React.FC<{ decision: AppUpdateDecision; compact?: boolean }> = ({
  decision,
  compact,
}) => (
  <View style={[styles.versionRow, compact && styles.versionRowCompact]}>
    <View style={styles.versionChip}>
      <Text style={styles.versionChipLabel}>CURRENT</Text>
      <Text style={styles.versionChipValue}>
        {versionLabel(decision.currentVersion, decision.currentBuild)}
      </Text>
    </View>
    <Ionicons name="arrow-forward" size={15} color={COLORS.primary} />
    <View style={[styles.versionChip, styles.versionChipNew]}>
      <Text style={[styles.versionChipLabel, { color: COLORS.primary }]}>NEW</Text>
      <Text style={[styles.versionChipValue, { color: COLORS.onSurface }]}>
        {versionLabel(decision.latestVersion, decision.buildNumber)}
      </Text>
    </View>
  </View>
);

const NotesCard: React.FC<{ notes: string[]; limit?: number }> = ({ notes, limit }) => {
  if (notes.length === 0) return null;
  const visible = typeof limit === 'number' ? notes.slice(0, limit) : notes;

  return (
    <View style={styles.notesCard}>
      <Text style={styles.notesTitle}>{"WHAT'S NEW"}</Text>
      {visible.map((note, index) => (
        <View key={`${note}-${index}`} style={styles.noteRow}>
          <View style={styles.noteDot} />
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ))}
    </View>
  );
};

const UpdateButton: React.FC<{
  decision: AppUpdateDecision;
  label?: string;
  compact?: boolean;
}> = ({ decision, label = 'UPDATE NOW', compact }) => (
  <AnimatedPressable
    onPress={() => void openStoreListing(decision.storeUrl)}
    scaleTo={0.98}
    accessibilityRole="button"
    accessibilityLabel="Update ULTIM from the app store"
    style={styles.primaryPressable}
  >
    <LinearGradient
      colors={GRADIENTS.primaryButton}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.primaryButton, compact && styles.primaryButtonCompact]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
      <Ionicons name="arrow-forward" size={17} color={COLORS.onPrimary} />
    </LinearGradient>
  </AnimatedPressable>
);

/**
 * Full-screen, non-dismissible gate shown before the navigator mounts when a
 * release is mandatory. The member cannot reach bookings until they update.
 */
export const ForceUpdateScreen: React.FC<UpdateGateProps> = ({
  decision,
  onRetry,
  checking,
}) => {
  const insets = useSafeAreaInsets();
  const notes = releaseNotesFor(decision);

  return (
    <View style={styles.forceRoot}>
      <LinearGradient
        colors={[COLORS.background, COLORS.background, COLORS.background]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <View style={[styles.forceSafe, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.brandRow}>
          <Text style={styles.brandWord}>ULTIM</Text>
          <View style={styles.brandPill}>
            <View style={styles.brandPillDot} />
            <Text style={styles.brandPillText}>APP UPDATE</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.forceScroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.heroOrb}>
            <LinearGradient
              colors={['rgba(255,106,26,0.28)', 'rgba(255,106,26,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="cloud-download-outline" size={38} color={COLORS.primary} />
          </View>

          <Text style={styles.eyebrow}>REQUIRED UPDATE</Text>
          <Text style={styles.forceTitle}>{decision.title || 'A new version is ready'}</Text>
          <Text style={styles.forceMessage}>
            {decision.message ||
              'Update ULTIM to keep booking sessions, using credits and checking in at the gate.'}
          </Text>

          <VersionRow decision={decision} />
          <NotesCard notes={notes} />
        </ScrollView>

        <View style={styles.forceFooter}>
          <UpdateButton decision={decision} />
          <Pressable
            onPress={onRetry}
            disabled={checking}
            accessibilityRole="button"
            accessibilityLabel="Check for the update again"
            style={styles.retryButton}
          >
            {checking ? (
              <ActivityIndicator size="small" color={COLORS.textMuted} />
            ) : (
              <Ionicons name="refresh" size={14} color={COLORS.textMuted} />
            )}
            <Text style={styles.retryText}>
              {checking ? 'Checking…' : 'Already updated? Check again'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

/**
 * Optional update bottom sheet. Dismissible, but re-appears for a newer
 * release. Uses the same visual language as the force gate so the two states
 * feel like one system.
 */
export const OptionalUpdateSheet: React.FC<UpdateGateProps> = ({
  decision,
  onRetry,
  checking,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const notes = releaseNotesFor(decision);
  const dismiss = onDismiss ?? (() => {});

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={dismiss} />

        <Animated.View
          entering={SlideInDown.duration(280)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}
        >
          <View style={styles.grabber} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <Ionicons name="sparkles-outline" size={20} color={COLORS.gold} />
            </View>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetEyebrow}>OPTIONAL UPDATE</Text>
              <Text style={styles.sheetTitle}>{decision.title || 'A fresher ULTIM is ready'}</Text>
            </View>
          </View>

          <Text style={styles.sheetMessage}>
            {decision.message ||
              'Pick up the latest fixes and improvements. You can keep using this version for now.'}
          </Text>

          <VersionRow decision={decision} compact />
          <NotesCard notes={notes} limit={3} />

          <View style={styles.sheetActions}>
            <AnimatedPressable
              onPress={dismiss}
              disabled={checking}
              scaleTo={0.98}
              accessibilityRole="button"
              accessibilityLabel="Remind me later"
              style={styles.secondaryPressable}
            >
              <View style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{checking ? 'CHECKING…' : 'NOT NOW'}</Text>
              </View>
            </AnimatedPressable>

            <View style={styles.sheetPrimary}>
              <UpdateButton decision={decision} label="UPDATE" compact />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  forceRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  forceSafe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  glowTop: {
    position: 'absolute',
    top: -130,
    right: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,106,26,0.05)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -180,
    left: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,106,26,0.03)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandWord: {
    color: COLORS.paper,
    fontFamily: FONTS.displayBold,
    fontSize: 23,
    letterSpacing: 3,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.emberBorder,
    backgroundColor: COLORS.emberPanel,
  },
  brandPillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  brandPillText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  forceScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 28,
  },
  heroOrb: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.emberBorder,
    marginBottom: 22,
  },
  eyebrow: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  forceTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 46,
    lineHeight: 42,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    maxWidth: 320,
  },
  forceMessage: {
    marginTop: 12,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 21,
    maxWidth: 340,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  versionRowCompact: {
    marginTop: 16,
    marginBottom: 2,
  },
  versionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 104,
  },
  versionChipNew: {
    borderColor: COLORS.emberBorder,
    backgroundColor: COLORS.emberPanel,
  },
  versionChipLabel: {
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontSize: 8,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  versionChipValue: {
    color: COLORS.onSurfaceVariant,
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
  notesCard: {
    marginTop: 22,
    padding: 14,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surfaceBright,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 8,
  },
  notesTitle: {
    color: COLORS.textMuted,
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  noteDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
  },
  noteText: {
    flex: 1,
    color: COLORS.onSurfaceVariant,
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  forceFooter: {
    paddingTop: 14,
    gap: 10,
  },
  primaryPressable: {
    width: '100%',
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonCompact: {
    height: 50,
  },
  primaryButtonText: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    letterSpacing: 1.7,
  },
  retryButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  retryText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.panel,
    borderTopRightRadius: RADIUS.panel,
    borderTopWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceHighest,
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.goldPanel,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetEyebrow: {
    color: COLORS.gold,
    fontFamily: FONTS.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  sheetTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 27,
    lineHeight: 26,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sheetMessage: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    lineHeight: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  secondaryPressable: {
    flex: 1,
  },
  secondaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surfaceBright,
  },
  secondaryButtonText: {
    color: COLORS.onSurfaceVariant,
    fontFamily: FONTS.bold,
    fontSize: 11.5,
    letterSpacing: 1.5,
  },
  sheetPrimary: {
    flex: 1.35,
  },
});
