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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { getActivityIcon } from '../utils/activityIcons';
import { FacilityCard } from '../components/FacilityCard';
import { RoundIconButton, ArenaEmptyState, Eyebrow } from '../components/ArenaUI';
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

export const CategoryFacilitiesScreen: React.FC<CategoryFacilitiesScreenProps> = ({
  route,
  navigation,
}) => {
  const { category = 'All', categoryTitle = 'Facilities' } = route.params || {};
  const { facilities: globalFacilities, colors, userCoords, nearLngLat } = useApp();
  const insets = useSafeAreaInsets();

  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activity, setActivity] = useState<string | undefined>(undefined);
  const [activityOptions, setActivityOptions] = useState<string[]>([]);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalDocs, setTotalDocs] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [focused, setFocused] = useState<boolean>(false);

  const requestIdRef = useRef<number>(0);

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
        if (requestId !== requestIdRef.current) return;

        if (res?.docs && Array.isArray(res.docs) && res.docs.length > 0) {
          const adapted = res.docs.map((t) => adaptTenantToFacility(t, userCoords));
          setFacilities((prev) => (mode === 'append' ? [...prev, ...adapted] : adapted));
          setPage(res.page ?? targetPage);
          setTotalDocs(res.totalDocs ?? adapted.length);
          setHasNextPage((res.page ?? targetPage) < (res.totalPages || 1));
          setFetchError(null);
        } else if (mode !== 'append') {
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

  useEffect(() => {
    fetchPage(1, 'reset');
  }, [fetchPage]);

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

  const topBarHeight = Math.max(insets.top, 12) + 56;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 6, height: topBarHeight }]}>
        <RoundIconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={styles.topBarTitle} numberOfLines={1}>
          ARENA DIRECTORY
        </Text>
        <View style={styles.topBarCount}>
          <Text style={styles.topBarCountText}>{totalDocs}</Text>
        </View>
      </View>

      <FlatList
        data={facilities}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FacilityCard
            facility={item}
            aspectRatio={16 / 9}
            style={styles.listItem}
            index={index % 10}
            onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[styles.listContent, { paddingTop: topBarHeight + 18 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        updateCellsBatchingPeriod={60}
        refreshControl={
          <RefreshControl
            progressViewOffset={topBarHeight}
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
            <View style={styles.pageHead}>
              <Eyebrow>Explore</Eyebrow>
              <Text style={styles.pageTitle}>{String(categoryTitle).toUpperCase()}</Text>
              <Text style={styles.pageSub}>Find a court, turf or studio and book your next session.</Text>
            </View>

            <View style={[styles.searchShell, focused && styles.searchShellFocused]}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder={`Search ${String(categoryTitle).toLowerCase()}...`}
                placeholderTextColor={COLORS.meta}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              {searching || searchInput.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchInput('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {searching && searchQuery === searchInput.trim() ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons name="close" size={17} color={COLORS.muted} />
                  )}
                </TouchableOpacity>
              ) : null}
            </View>

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
                  <Ionicons name="grid-outline" size={12} color={!activity ? COLORS.primary : COLORS.muted} />
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
                        color={isActive ? COLORS.primary : COLORS.muted}
                      />
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {opt.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {loading ? 'SEARCHING…' : `${totalDocs} ${totalDocs === 1 ? 'CENTER' : 'CENTERS'}`}
                {activity ? ` · ${activity.toUpperCase()}` : ''}
              </Text>
            </View>

            {fetchError && (
              <View style={styles.errorBanner}>
                <Ionicons name="cloud-offline-outline" size={14} color={COLORS.primary} />
                <Text style={styles.errorBannerText}>{fetchError}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <ArenaEmptyState
              icon="barbell-outline"
              title="No centers found"
              copy={
                hasActiveFilters
                  ? `Nothing matches your filters in ${String(categoryTitle)}.`
                  : `No ${String(categoryTitle).toLowerCase()} centers available right now.`
              }
              action={
                hasActiveFilters && (
                  <TouchableOpacity onPress={clearFilters} style={{ marginTop: 4 }}>
                    <Text style={styles.clearLink}>CLEAR FILTERS</Text>
                  </TouchableOpacity>
                )
              }
            />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSoft,
  },
  topBarTitle: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
  },
  topBarCount: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceBright,
  },
  topBarCountText: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  listHeader: {
    marginBottom: 8,
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
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 54,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.surface,
  },
  searchShellFocused: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 19,
  },
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
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryMuted,
  },
  chipText: {
    color: COLORS.muted,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.7,
  },
  chipTextActive: {
    color: COLORS.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  metaText: {
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 0.9,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.primaryMuted,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: 11,
    lineHeight: 15,
  },
  listItem: {
    flex: 1,
  },
  separator: {
    height: 24,
  },
  clearLink: {
    color: COLORS.primary,
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  footerLoaderText: {
    color: COLORS.muted,
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  endText: {
    paddingVertical: 22,
    color: COLORS.meta,
    fontFamily: FONTS.extraBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
});
