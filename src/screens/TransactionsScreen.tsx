import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { DetailTopBar, ArenaEmptyState, Eyebrow } from '../components/ArenaUI';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { CreditTransaction } from '../types';

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

const methodLabel = (m?: string) => {
  const v = String(m || '').toLowerCase();
  if (v === 'banktransfer') return 'BANK TRANSFER';
  if (!v) return 'OFFLINE';
  return v.toUpperCase();
};

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
  const { transactions, isLoading, colors } = useApp();
  const insets = useSafeAreaInsets();

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
    let paid = 0;
    transactions.forEach((tx) => {
      paid += Number(tx.amountINR ?? tx.credits ?? 0) || 0;
    });
    return { paid, count: transactions.length };
  }, [transactions]);

  const topBarHeight = Math.max(insets.top, 12) + 60;

  const renderItem = (tx: CreditTransaction) => {
    return (
      <View style={styles.card}>
        <View style={[styles.iconChip, { backgroundColor: `${COLORS.success}18` }]}>
          <Ionicons name="cash-outline" size={16} color={COLORS.success} />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {tx.description}
          </Text>
          <Text style={styles.cardFacility} numberOfLines={1}>
            {tx.facilityName}
          </Text>
          <Text style={styles.cardDate}>{tx.date}</Text>
        </View>

        <View style={styles.amountCol}>
          <Text style={styles.amountText}>{inr(tx.amountINR ?? tx.credits ?? 0)}</Text>
          <Text style={styles.amountLabel}>{methodLabel(tx.paymentMethod)} · PAID</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />

      <View style={[styles.topBar, { height: topBarHeight, paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <DetailTopBar label="Credit ledger" onBack={() => navigation.goBack()} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderItem(item)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        contentContainerStyle={[styles.listContent, { paddingTop: topBarHeight + 8 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.pageHead}>
              <Eyebrow>Payments</Eyebrow>
              <Text style={styles.pageTitle}>Transactions</Text>
              <Text style={styles.pageSub}>
                Real rupee payments made at the reception desk, linked to your passes.
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>TOTAL PAID</Text>
                <Text style={styles.summaryValue}>{inr(totals.paid)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>PAYMENTS</Text>
                <Text style={[styles.summaryValueSm, { color: COLORS.paper }]}>
                  {totals.count}
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 60 }} />
          ) : (
            <ArenaEmptyState
              icon="receipt-outline"
              title="No transactions yet"
              copy="Payments you make at a center reception desk will show up here with the real rupee amount."
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: SPACING.containerPadding,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  pageHead: {
    marginBottom: 18,
  },
  pageTitle: {
    marginTop: 6,
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 38,
    lineHeight: 36,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pageSub: {
    maxWidth: 320,
    marginTop: 8,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.lineSoft,
  },
  summaryLabel: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  summaryValueSm: {
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 1.1,
  },
  separator: {
    height: 9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTitle: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  cardFacility: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 15,
  },
  cardDate: {
    color: COLORS.meta,
    fontFamily: FONTS.regular,
    fontSize: 10,
    lineHeight: 13,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amountText: {
    color: COLORS.paper,
    fontFamily: FONTS.display,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  amountLabel: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
});
