import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../theme/theme';
import { AnimatedPressable } from './buttons/AnimatedPressable';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Two skewed arena bars + wordmark. */
export const ArenaBrand: React.FC<{ compact?: boolean; wordmark?: string }> = ({
  compact = false,
  wordmark = 'ULTIM',
}) => (
  <View style={styles.brand} accessibilityLabel={wordmark}>
    <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
      <View style={[styles.brandBar, compact && styles.brandBarCompact]} />
      <View style={[styles.brandBar, styles.brandBarShort, compact && styles.brandBarCompact]} />
    </View>
    <Text style={[styles.brandName, compact && styles.brandNameCompact]}>{wordmark}</Text>
  </View>
);

/** Small orange all-caps kicker above titles. */
export const Eyebrow: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style,
}) => <Text style={[styles.eyebrow, style]}>{children}</Text>;

/** Section heading block used across every tab. */
export const SectionHead: React.FC<{
  eyebrow?: string;
  title: string;
  meta?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ eyebrow, title, meta, action, style }) => (
  <View style={[styles.sectionHead, style]}>
    <View style={styles.sectionHeadingGroup}>
      {!!eyebrow && <Eyebrow style={styles.sectionHeadEyebrow}>{eyebrow}</Eyebrow>}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {action ?? (!!meta && <Text style={styles.sectionMeta}>{meta}</Text>)}
  </View>
);

/** Big page opening used on tab screens and full-screen flows. */
export const PageHead: React.FC<{
  eyebrow?: string;
  title: string;
  accent?: string;
  sub?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ eyebrow, title, accent, sub, style }) => (
  <View style={[styles.pageHead, style]}>
    {!!eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <Text style={styles.pageTitle}>
      {title}
      {!!accent && <Text style={styles.accentText}>{accent}</Text>}
    </Text>
    {!!sub && <Text style={styles.pageSub}>{sub}</Text>}
  </View>
);

/** Circular outlined control used for back/close/gallery arrows. */
export const RoundIconButton: React.FC<{
  icon: IoniconName;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ icon, onPress, size = 44, iconSize = 19, color = COLORS.paper, background = COLORS.surface, style }) => (
  <AnimatedPressable onPress={onPress} scaleTo={0.9} style={style}>
    <View
      style={[
        styles.roundButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
        },
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={color} />
    </View>
  </AnimatedPressable>
);

/** Back row that opens full-screen detail views. */
export const DetailTopBar: React.FC<{
  label: string;
  onBack: () => void;
  right?: React.ReactNode;
}> = ({ label, onBack, right }) => (
  <View style={styles.detailTopBar}>
    <RoundIconButton icon="arrow-back" onPress={onBack} />
    <Text style={styles.detailTopLabel}>{label}</Text>
    <View style={styles.detailTopRight}>{right}</View>
  </View>
);

/** Flat empty/error panel matching the reference's dashed empty state. */
export const ArenaEmptyState: React.FC<{
  icon?: IoniconName;
  title: string;
  copy: string;
  action?: React.ReactNode;
}> = ({ icon = 'barbell-outline', title, copy, action }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon} size={28} color={COLORS.meta} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyCopy}>{copy}</Text>
    {action}
  </View>
);

/** Small outlined pill used for facts and amenities. */
export const FactPill: React.FC<{
  children: React.ReactNode;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ children, dot, style }) => (
  <View style={[styles.factPill, style]}>
    {dot && <View style={styles.factDot} />}
    {typeof children === 'string' ? <Text style={styles.factText}>{children}</Text> : children}
  </View>
);

/** Text link action with arrow — used for "View arena", "Clear", etc. */
export const InlineAction: React.FC<{
  label: string;
  onPress: () => void;
  icon?: IoniconName;
  color?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ label, onPress, icon = 'arrow-forward', color = COLORS.primary, style }) => (
  <AnimatedPressable onPress={onPress} scaleTo={0.97} style={style}>
    <View style={styles.inlineAction}>
      <Text style={[styles.inlineActionText, { color }]}>{label}</Text>
      <Ionicons name={icon} size={14} color={color} />
    </View>
  </AnimatedPressable>
);

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 22,
  },
  brandMarkCompact: {
    height: 18,
  },
  brandBar: {
    width: 4,
    height: 20,
    backgroundColor: COLORS.primary,
    transform: [{ skewX: '-16deg' }],
  },
  brandBarShort: {
    height: 13,
    opacity: 0.72,
  },
  brandBarCompact: {
    width: 3,
    height: 17,
  },
  brandName: {
    color: COLORS.paper,
    fontFamily: FONTS.displayBold,
    fontSize: 23,
    lineHeight: 24,
    letterSpacing: 3.2,
  },
  brandNameCompact: {
    fontSize: 21,
    letterSpacing: 2.8,
  },
  eyebrow: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  sectionHeadingGroup: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeadEyebrow: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 29,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    paddingBottom: 3,
    color: COLORS.meta,
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  pageHead: {
    marginBottom: 24,
  },
  pageTitle: {
    marginTop: 8,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 42,
    lineHeight: 39,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  accentText: {
    color: COLORS.primary,
  },
  pageSub: {
    maxWidth: 340,
    marginTop: 10,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  roundButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
  },
  detailTopLabel: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  detailTopRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'flex-start',
    gap: 7,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: 'rgba(255,255,255,0.012)',
  },
  emptyTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCopy: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  factPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 30,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
  },
  factDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  factText: {
    color: COLORS.paperDim,
    fontFamily: FONTS.bold,
    fontSize: 10,
    lineHeight: 13,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  inlineActionText: {
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
