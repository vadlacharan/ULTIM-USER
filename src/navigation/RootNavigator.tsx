import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme/theme';
import { BlurTabBar } from './BlurTabBar';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AccessScreen } from '../screens/AccessScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FacilityDetailScreen } from '../screens/FacilityDetailScreen';
import { PlanDetailScreen } from '../screens/PlanDetailScreen';
import { BookingFlowScreen } from '../screens/BookingFlowScreen';
import { CategoryFacilitiesScreen } from '../screens/CategoryFacilitiesScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { OfflineScreen } from '../screens/OfflineScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { LegalScreen } from '../screens/LegalScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BlurTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'HOME' }} />
      <Tab.Screen name="AccessTab" component={AccessScreen} options={{ tabBarLabel: 'ACCESS' }} />
      <Tab.Screen name="BookingsTab" component={BookingsScreen} options={{ tabBarLabel: 'BOOKINGS' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'PROFILE' }} />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { isAuthenticated, isGuest, isBootstrapping, isOffline, facilities, refreshData } = useApp();

  // Show a blank dark screen while restoring session — prevents login flash
  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Render themed Offline screen if disconnected and no cached facility list
  if (isOffline && facilities.length === 0) {
    return <OfflineScreen onRetry={refreshData} />;
  }

  const canBrowse = isAuthenticated || isGuest;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {!canBrowse ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="FacilityDetail" component={FacilityDetailScreen} />
          <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
          <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
          <Stack.Screen name="CategoryFacilities" component={CategoryFacilitiesScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
          <Stack.Screen name="Offline" component={OfflineScreen} />
          {/* Reachable from guest mode when prompts ask the user to sign in */}
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'slide_from_bottom' }} />
        </>
      )}
    </Stack.Navigator>
  );
};
