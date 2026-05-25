import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import {
  NavigationContainer,
  NavigationContainerRef,
  DefaultTheme,
  DarkTheme,
  LinkingOptions,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { routeForActionUrl, applyRoute } from './src/services/notificationRouting';

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
      ConnectStripe: 'settings/stripe',
      Notifications: 'notifications',
      NotificationSettings: 'settings/notifications',
      Settings: 'settings',
      Friends: 'friends',
      Analytics: 'analytics',
    },
  },
  // Custom function to get the split ID from the payment link code
  getStateFromPath(path, _options) {
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
  // Shared ref so the push-notification tap handler can navigate from outside
  // any React component (and from a cold-start path before screens mount).
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  // Stash any cold-start route until NavigationContainer becomes ready.
  const pendingRouteRef = useRef<ReturnType<typeof routeForActionUrl> | null>(null);

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

  // Push-notification tap routing.
  // Three cases to handle:
  //   1. Cold start — app was killed, user tapped the notification: use
  //      getLastNotificationResponseAsync() to discover the action_url.
  //   2. Background → foreground tap: addNotificationResponseReceivedListener.
  //   3. Foreground in-app receipt: we don't auto-navigate — the user is
  //      already in the app and the in-app banner is enough.
  useEffect(() => {
    let mounted = true;

    const route = (actionUrl: string | undefined | null) => {
      const target = routeForActionUrl(actionUrl);
      if (!target) return;
      if (!applyRoute(navigationRef.current, target)) {
        pendingRouteRef.current = target;
      }
    };

    // 1. Cold start.
    Notifications.getLastNotificationResponseAsync().then((res) => {
      if (!mounted || !res) return;
      const data: any = res.notification?.request?.content?.data ?? {};
      route(data.actionUrl);
    });

    // 2. Background → foreground.
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data: any = res.notification?.request?.content?.data ?? {};
      route(data.actionUrl);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // Drain pending route the moment navigation becomes ready (cold start case).
  const handleReady = () => {
    if (pendingRouteRef.current) {
      const ok = applyRoute(navigationRef.current, pendingRouteRef.current);
      if (ok) pendingRouteRef.current = null;
    }
  };

  if (!stripePublishableKey) {
    console.warn('⚠️ Stripe publishable key not found. Payment features will not work.');
    return (
      <NavigationContainer
        ref={navigationRef}
        onReady={handleReady}
        theme={navigationTheme}
        linking={linking}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <AppNavigator />
        </View>
      </NavigationContainer>
    );
  }

  return (
    <StripeProvider
      publishableKey={stripePublishableKey}
      merchantIdentifier="merchant.com.zapsplit.app"
      urlScheme="zapsplit"
    >
      <NavigationContainer
        ref={navigationRef}
        onReady={handleReady}
        theme={navigationTheme}
        linking={linking}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <AppNavigator />
        </View>
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
