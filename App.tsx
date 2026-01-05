import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Inner app component that uses theme
function AppContent() {
  const { isDark, colors } = useTheme();
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Custom navigation theme based on our theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  // Hide splash screen after a short delay to show branding
  useEffect(() => {
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Show for 1.5 seconds
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  if (!stripePublishableKey) {
    console.warn('⚠️ Stripe publishable key not found. Payment features will not work.');
    return (
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    );
  }

  return (
    <StripeProvider
      publishableKey={stripePublishableKey}
      merchantIdentifier="merchant.com.zapsplit.app"
      urlScheme="zapsplit"
    >
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
