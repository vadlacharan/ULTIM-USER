import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
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
import { DARK_COLORS, LIGHT_COLORS } from './src/theme/theme';

// Keep native splash visible while JS bundle + fonts load
SplashScreen.preventAutoHideAsync();

function MainAppContent() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const { themeMode, colors } = useApp();

  const navTheme = useMemo(() => {
    return themeMode === 'light'
      ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: LIGHT_COLORS.background,
          card: LIGHT_COLORS.surface,
          text: LIGHT_COLORS.onSurface,
          border: LIGHT_COLORS.surfaceHigh,
          primary: LIGHT_COLORS.primary,
        },
      }
      : {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: DARK_COLORS.background,
          card: DARK_COLORS.surface,
          text: DARK_COLORS.onSurface,
          border: DARK_COLORS.surfaceHigh,
          primary: DARK_COLORS.primary,
        },
      };
  }, [themeMode]);

  const onLayout = useCallback(async () => {
    if (!appReady) {
      await SplashScreen.hideAsync().catch(() => { });
      setAppReady(true);
    }
  }, [appReady]);

  return (
    <View style={[styles.rootView, { backgroundColor: colors.background }]} onLayout={onLayout}>
      <NavigationContainer theme={navTheme}>
        <StatusBar
          style={themeMode === 'dark' ? 'light' : 'dark'}
          backgroundColor={colors.background}
        />
        <RootNavigator />
      </NavigationContainer>

      {/* Animated splash sits on top until animation finishes */}
      {showAnimatedSplash && (
        <AnimatedSplash onFinish={() => setShowAnimatedSplash(false)} />
      )}
    </View>
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
    <SafeAreaProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});
