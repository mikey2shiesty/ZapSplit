import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Deep linking configuration
const linking: LinkingOptions<any> = {
  prefixes: [
    Linking.createURL('/'),
    'https://zapsplit.app',
    'https://www.zapsplit.app',
    'zapsplit://',
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Splits: 'splits',
        },
      },
      SplitFlow: {
        screens: {
          ClaimItems: 'pay/:code',
          SplitDetail: 'split/:splitId',
        },
      },
    },
  },
  // Custom function to get the split ID from the payment link code
  async getStateFromPath(path, options) {
    // Handle /pay/:code URLs - need to look up splitId from code
    const payMatch = path.match(/\/pay\/([^/?]+)/);
    if (payMatch) {
      const code = payMatch[1];
      // Return state that navigates to ClaimItems with the code
      // The screen will look up the splitId from the code
      return {
        routes: [
          {
            name: 'SplitFlow',
            state: {
              routes: [
                {
                  name: 'ClaimItems',
                  params: { paymentLinkCode: code },
                },
              ],
            },
          },
        ],
      };
    }
    // Default behavior for other paths
    return undefined;
  },
};

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
      <NavigationContainer theme={navigationTheme} linking={linking}>
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
      <NavigationContainer theme={navigationTheme} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
