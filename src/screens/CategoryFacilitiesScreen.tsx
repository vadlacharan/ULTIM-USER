import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { FacilityCard } from '../components/FacilityCard';
import { IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { adaptTenantToFacility } from '../services/adapters';
import { Facility } from '../types';

interface CategoryFacilitiesScreenProps {
  route: any;
  navigation: any;
}

export const CategoryFacilitiesScreen: React.FC<CategoryFacilitiesScreenProps> = ({
  route,
  navigation,
}) => {
  const { category = 'All', categoryTitle = 'Facilities' } = route.params || {};
  const { facilities: globalFacilities, colors } = useApp();
  const insets = useSafeAreaInsets();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch page of tenants from Payload CMS
  const fetchCategoryPage = useCallback(
    async (targetPage: number, isRefresh = false) => {
      try {
        if (targetPage === 1 && !isRefresh) setLoading(true);
        if (targetPage > 1) setLoadingMore(true);

        const res = await api.getTenants({
          category: category !== 'All' ? category : undefined,
          page: targetPage,
          limit: 10,
        });

        if (res?.docs && Array.isArray(res.docs)) {
          const adapted = res.docs.map((t) => adaptTenantToFacility(t));
          if (targetPage === 1) {
            setFacilities(adapted);
          } else {
            setFacilities((prev) => [...prev, ...adapted]);
          }
          setHasNextPage(targetPage < (res.totalPages || 1));
        } else if (targetPage === 1) {
          const fallback = globalFacilities.filter((f) => {
            if (category === 'All') return true;
            const catA = (f.category || '').toLowerCase();
            const catB = (category || '').toLowerCase();
            if (catA.startsWith('sport') && catB.startsWith('sport')) return true;
            return catA === catB;
          });
          setFacilities(fallback);
          setHasNextPage(false);
        }
      } catch (e) {
        console.log('[CategoryFacilities] Fetch page error:', e);
        if (targetPage === 1) {
          const fallback = globalFacilities.filter((f) => {
            if (category === 'All') return true;
            const catA = (f.category || '').toLowerCase();
            const catB = (category || '').toLowerCase();
            if (catA.startsWith('sport') && catB.startsWith('sport')) return true;
            return catA === catB;
          });
          setFacilities(fallback);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [category, globalFacilities]
  );

  useEffect(() => {
    fetchCategoryPage(1);
  }, [fetchCategoryPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchCategoryPage(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCategoryPage(nextPage);
    }
  };

  // Filter facilities by search query
  const filteredFacilities = facilities.filter((f) => {
    return (
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.sportTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with Safe Area Inset */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12) + 6,
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceHigh,
          },
        ]}
      >
        <IconButton
          icon="arrow-back"
          size={40}
          iconSize={22}
          iconColor={colors.onSurface}
          backgroundColor={colors.surfaceLow}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>{categoryTitle.toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredFacilities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FacilityCard
            facility={item}
            onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                Showing {filteredFacilities.length} {categoryTitle} centers
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyCard}>
              <Ionicons name="fitness-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Centers Found</Text>
              <Text style={styles.emptySub}>
                No centers found matching "{searchQuery}" in {categoryTitle}.
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.footerLoaderText}>Loading more centers...</Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceHigh,
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 14,
  },
  countRow: {
    marginBottom: SPACING.md,
  },
  countText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    lineHeight: 17,
    color: COLORS.textMuted,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceHigh,
  },
  emptyTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    marginTop: 10,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  footerLoaderText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
});
