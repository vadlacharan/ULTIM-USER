import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { BlurHeader, useBlurBackHeaderLayout } from '../components/Blur';
import { IconButton } from '../components/buttons';
import { CreditIcon } from '../components/CreditIcon';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { CreditTransaction } from '../types';

interface TransactionsScreenProps {
  navigation: any;
}

const monthLabel = (dateStr: string): string => {
  const datePart = (dateStr || '').split(' ')[0];
  const d = new Date(datePart);
  if (isNaN(d.getTime())) return 'EARLIER';
  return d
    .toLocaleString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
};

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const { transactions, totalActiveCredits, isLoading, colors } = useApp();
  const { top: headerTop, height: headerHeight } = useBlurBackHeaderLayout();

  const sections = useMemo(() => {
    const byMonth = new Map<string, CreditTransaction[]>();
    transactions.forEach((tx) => {
      const key = monthLabel(tx.date);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(tx);
    });
    return Array.from(byMonth.entries()).map(([title, data]) => ({ title, data }));
  }, [transactions]);

  const totals = useMemo(() => {
    let earned = 0;
    let spent = 0;
    transactions.forEach((tx) => {
      if (tx.credits >= 0) earned += tx.credits;
      else spent += Math.abs(tx.credits);
    });
    return { earned, spent };
  }, [transactions]);

  const renderItem = (tx: CreditTransaction) => {
    const isCredit = tx.credits >= 0;
    const accent = isCredit ? COLORS.secondary : COLORS.primary;

    return (
      <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        <View style={[styles.iconChip, { backgroundColor: `${accent}1F`, borderColor: `${accent}47` }]}>
          <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={16} color={accent} />
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {tx.description}
          </Text>
          <Text style={[styles.cardFacility, { color: colors.textMuted }]} numberOfLines={1}>
            {tx.facilityName}
          </Text>
          <Text style={[styles.cardDate, { color: 'rgba(255,255,255,0.38)' }]}>{tx.date}</Text>
        </View>

        <View style={styles.amountCol}>
          <View style={styles.amountRow}>
            <Text style={[styles.amountText, { color: accent }]}>
              {isCredit ? '+' : '-'}
              {Math.abs(tx.credits)}
            </Text>
            <CreditIcon size={14} />
          </View>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
            {isCredit ? 'ADDED' : 'SPENT'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderItem(item)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={{ height: 6 }} />}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 24 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.summaryCard, { backgroundColor: colors.emberPanel, borderColor: colors.emberBorder }]}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>CURRENT BALANCE</Text>
              <View style={styles.summaryValueRow}>
                <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{totalActiveCredits}</Text>
                <CreditIcon size={18} />
              </View>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>EARNED</Text>
              <Text style={[styles.summaryValueSm, { color: COLORS.secondary }]}>+{totals.earned}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.10)' }]} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>SPENT</Text>
              <Text style={[styles.summaryValueSm, { color: COLORS.primary }]}>-{totals.spent}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 60 }} />
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Transactions Yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Credits you receive at a center reception desk and credits spent on sessions will show up here.
              </Text>
            </View>
          )
        }
      />

      {/* Floating blur header — list scrolls behind it */}
      <BlurHeader
        height={headerHeight}
        contentStyle={{
          paddingTop: headerTop,
          paddingHorizontal: SPACING.containerPadding,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          icon="arrow-back"
          size={40}
          iconSize={22}
          iconColor={colors.onSurface}
          backgroundColor={colors.glassHigh}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Transactions</Text>
        <View style={{ width: 40 }} />
      </BlurHeader>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },

  // ── Summary ──
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 34,
  },
  summaryLabel: {
    fontSize: 8.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    color: COLORS.textMuted,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: FONTS.black,
    letterSpacing: -0.5,
  },
  summaryValueSm: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },

  // ── Sections ──
  sectionHeader: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.4,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginBottom: 10,
  },
  separator: {
    height: 10,
  },

  // ── Card ──
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: 13,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  cardFacility: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
  },
  cardDate: {
    fontSize: 10.5,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.3,
  },
  amountLabel: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
  },

  // ── Empty ──
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
