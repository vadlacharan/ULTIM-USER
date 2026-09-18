import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { BlurHeader, useBlurBackHeaderLayout } from '../components/Blur';
import { FacilityCard } from '../components/FacilityCard';
import { IconButton, OutlineButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';
import { api } from '../services/api';
import { adaptTenantToFacility } from '../services/adapters';
import { Facility } from '../types';

interface CategoryFacilitiesScreenProps {
  route: any;
  navigation: any;
}


const PAGE_SIZE = 10;

const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export const CategoryFacilitiesScreen: React.FC<CategoryFacilitiesScreenProps> = ({
  route,
  navigation,
}) => {
  const { category = 'All', categoryTitle = 'Facilities' } = route.params || {};
  const { facilities: globalFacilities, colors, userCoords, nearLngLat } = useApp();
  const { top: headerTop, height: headerHeight } = useBlurBackHeaderLayout();

  // ── Filters (all server-side) ──────────────────────────────────────────
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activity, setActivity] = useState<string | undefined>(undefined);
  const [activityOptions, setActivityOptions] = useState<string[]>([]);

  // ── Paged results ──────────────────────────────────────────────────────
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Guards against out-of-order responses while typing.
  const requestIdRef = useRef<number>(0);

  // Debounce the search box → server query
  useEffect(() => {
    setSearching(true);
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  const buildQuery = useCallback(
    (targetPage: number) => ({
      category: category !== 'All' ? category : undefined,
      search: searchQuery || undefined,
      activity,
      nearLngLat: nearLngLat,
      page: targetPage,
      limit: PAGE_SIZE,
    }),
    [category, searchQuery, activity, nearLngLat]
  );

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'reset' | 'append' | 'refresh') => {
      const requestId = ++requestIdRef.current;
      try {
        if (mode === 'reset') setLoading(true);
        if (mode === 'append') setLoadingMore(true);

        const res = await api.getTenants(buildQuery(targetPage));
        if (requestId !== requestIdRef.current) return; // stale response

        if (res?.docs && Array.isArray(res.docs) && res.docs.length > 0) {
          const adapted = res.docs.map((t) => adaptTenantToFacility(t, userCoords));
          setFacilities((prev) => (mode === 'append' ? [...prev, ...adapted] : adapted));
          setPage(res.page ?? targetPage);
          setTotalDocs(res.totalDocs ?? adapted.length);
          setHasNextPage((res.page ?? targetPage) < (res.totalPages || 1));
          setFetchError(null);
        } else if (mode !== 'append') {
          // Server returned nothing — fall back to cached list only when the
          // request was unfiltered (pure offline / API-empty case).
          if (!searchQuery && !activity && targetPage === 1 && globalFacilities.length > 0) {
            const fallback = globalFacilities.filter((f) => {
              if (category === 'All') return true;
              const catA = (f.category || '').toLowerCase();
              const catB = (category || '').toLowerCase();
              if (catA.startsWith('sport') && catB.startsWith('sport')) return true;
              return catA === catB;
            });
            setFacilities(fallback);
            setTotalDocs(fallback.length);
          } else {
            setFacilities([]);
            setTotalDocs(0);
          }
          setHasNextPage(false);
          setFetchError(null);
        }
      } catch (e: any) {
        if (requestId !== requestIdRef.current) return;
        console.log('[CategoryFacilities] Fetch error:', e);
        if (mode !== 'append') {
          const fallback = globalFacilities.filter((f) => {
            if (category === 'All') return true;
            const catA = (f.category || '').toLowerCase();
            const catB = (category || '').toLowerCase();
            if (catA.startsWith('sport') && catB.startsWith('sport')) return true;
            return catA === catB;
          });
          setFacilities(fallback);
          setTotalDocs(fallback.length);
          setFetchError('Could not reach the server — showing cached centers.');
        }
        setHasNextPage(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
          setSearching(false);
        }
      }
    },
    [buildQuery, category, searchQuery, activity, globalFacilities, userCoords]
  );

  // Filter changes always restart from page 1
  useEffect(() => {
    fetchPage(1, 'reset');
  }, [fetchPage]);

  // Collect activity chips for this category (single lightweight call)
  useEffect(() => {
    let cancelled = false;
    const loadActivityOptions = async () => {
      try {
        const res = await api.getTenants({
          category: category !== 'All' ? category : undefined,
          limit: 100,
        });
        if (cancelled) return;
        const values = new Set<string>();
        (res?.docs || []).forEach((t: any) => {
          (t.activities || []).forEach((a: any) => {
            const v = typeof a === 'string' ? a : a?.activity;
            if (v && typeof v === 'string') values.add(v.toLowerCase());
          });
        });
        setActivityOptions(Array.from(values).sort());
      } catch (e) {
        console.log('[CategoryFacilities] Activity options error:', e);
      }
    };
    loadActivityOptions();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPage(1, 'refresh');
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasNextPage) return;
    fetchPage(page + 1, 'append');
  };

  const hasActiveFilters = !!searchQuery || !!activity;

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setActivity(undefined);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />
      <FlatList
        data={facilities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FacilityCard
            facility={item}
            aspectRatio={16 / 9}
            style={styles.listItem}
            onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            progressViewOffset={headerHeight}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* ── SEARCH (server-side, debounced) ── */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={17} color={colors.textMuted} />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder={`Search ${categoryTitle.toLowerCase()}...`}
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.onSurface }]}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searching || searchInput.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchInput('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {searching && searchQuery === searchInput.trim() ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="close-circle" size={17} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ── FILTER CHIPS (server-side activity filter) ── */}
            {activityOptions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsRow}
                contentContainerStyle={styles.chipsContent}
              >
                <TouchableOpacity
                  style={[styles.chip, !activity && styles.chipActive]}
                  onPress={() => setActivity(undefined)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="apps" size={12} color={!activity ? colors.primary : colors.textMuted} />
                  <Text style={[styles.chipText, !activity && styles.chipTextActive]}>ALL</Text>
                </TouchableOpacity>
                {activityOptions.map((opt) => {
                  const isActive = activity === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => setActivity(isActive ? undefined : opt)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={getActivityIcon(opt)}
                        size={13}
                        color={isActive ? colors.primary : colors.textMuted}
                      />
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {opt.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* ── RESULTS META ── */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {loading ? 'SEARCHING…' : `${totalDocs} ${totalDocs === 1 ? 'CENTER' : 'CENTERS'}`}
                {activity ? ` · ${activity.toUpperCase()}` : ''}
              </Text>
            </View>

            {fetchError && (
              <View style={styles.errorBanner}>
                <Ionicons name="cloud-offline-outline" size={14} color={COLORS.tertiary} />
                <Text style={styles.errorBannerText}>{fetchError}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Ionicons name="barbell-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No Centers Found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {hasActiveFilters
                  ? `Nothing matches your filters in ${categoryTitle}.`
                  : `No ${categoryTitle.toLowerCase()} centers available right now.`}
              </Text>
              {hasActiveFilters && (
                <OutlineButton
                  label="CLEAR FILTERS"
                  icon="close"
                  color={colors.primary}
                  compact
                  onPress={clearFilters}
                  style={styles.emptyAction}
                />
              )}
            </View>
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 60 }} />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.footerLoaderText}>Loading more centers…</Text>
            </View>
          ) : facilities.length > 0 && !hasNextPage ? (
            <Text style={styles.endText}>END OF RESULTS</Text>
          ) : null
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
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>{categoryTitle.toUpperCase()}</Text>
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
  topBarTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  listHeader: {
    marginBottom: 4,
  },
  listItem: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 22,
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },

  // ── Filter chips ──
  chipsRow: {
    marginTop: 12,
    marginHorizontal: -SPACING.containerPadding,
  },
  chipsContent: {
    paddingHorizontal: SPACING.containerPadding,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  chipActive: {
    backgroundColor: COLORS.emberPanel,
    borderColor: COLORS.emberBorder,
  },
  chipText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: COLORS.primary,
  },

  // ── Meta ──
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  metaText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    color: COLORS.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,164,43,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,164,43,0.28)',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONTS.medium,
    color: COLORS.tertiary,
  },

  // ── Empty / footer ──
  emptyCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
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
    lineHeight: 17,
  },
  emptyAction: {
    marginTop: SPACING.sm,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  footerLoaderText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  endText: {
    textAlign: 'center',
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.28)',
    paddingVertical: 22,
  },
});
