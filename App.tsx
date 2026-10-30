import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
  PublicSans_900Black,
} from '@expo-google-fonts/public-sans';
import { AppProvider, useApp } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { ForceUpdateScreen, OptionalUpdateSheet } from './src/components/AppUpdateGate';
import { useAppUpdate } from './src/hooks/useAppUpdate';
import { COLORS } from './src/theme/theme';
import type { AppUpdateDecision } from './src/services/appUpdates';

// Keep native splash visible while JS bundle + fonts load
SplashScreen.preventAutoHideAsync();

// Suspends inactive screens (paired with freezeOnBlur) to cut render jank.
enableFreeze(true);

function MainAppContent({
  updateDecision,
  updateChecking,
  onDismissUpdate,
  onRetryUpdate,
}: {
  updateDecision: AppUpdateDecision | null;
  updateChecking: boolean;
  onDismissUpdate: () => void;
  onRetryUpdate: () => void;
}) {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const { colors } = useApp();

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: COLORS.background,
      card: COLORS.surfaceContainer,
      text: COLORS.onSurface,
      border: COLORS.surfaceHigh,
      primary: COLORS.primary,
    },
  };

  const onLayout = useCallback(async () => {
    if (!appReady) {
      await SplashScreen.hideAsync().catch(() => { });
      setAppReady(true);
    }
  }, [appReady]);

  return (
    <View style={[styles.rootView, { backgroundColor: colors.background }]} onLayout={onLayout}>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>

      {/* Animated splash sits on top until animation finishes */}
      {showAnimatedSplash && (
        <AnimatedSplash onFinish={() => setShowAnimatedSplash(false)} />
      )}

      {/* Optional update waits for the splash so the first frame stays clean */}
      {!showAnimatedSplash && updateDecision && !updateDecision.forceUpdate && (
        <OptionalUpdateSheet
          decision={updateDecision}
          checking={updateChecking}
          onRetry={onRetryUpdate}
          onDismiss={onDismissUpdate}
        />
      )}
    </View>
  );
}

/**
 * Boot gate: the release check runs before AppProvider (and therefore before
 * GPS, facilities, plans and session hydration). A mandatory update never
 * reaches the navigator; an optional one becomes a dismissible sheet.
 */
function AppBootstrap() {
  const update = useAppUpdate();

  useEffect(() => {
    if (!update.initializing) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [update.initializing]);

  if (update.initializing) return null;

  if (update.decision?.forceUpdate) {
    return (
      <ForceUpdateScreen
        decision={update.decision}
        checking={update.checking}
        onRetry={update.recheck}
      />
    );
  }

  return (
    <AppProvider>
      <MainAppContent
        updateDecision={update.decision}
        updateChecking={update.checking}
        onDismissUpdate={update.dismiss}
        onRetryUpdate={update.recheck}
      />
    </AppProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
    PublicSans_900Black,
  });

  // Don't render anything until fonts are ready — avoids FOUT
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <AppBootstrap />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});
