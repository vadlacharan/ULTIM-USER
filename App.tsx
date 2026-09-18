import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { COLORS } from './src/theme/theme';

// Keep native splash visible while JS bundle + fonts load
SplashScreen.preventAutoHideAsync();

function MainAppContent() {
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
        <StatusBar style="light" backgroundColor="transparent" translucent />
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
