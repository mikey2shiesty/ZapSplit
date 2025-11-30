import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  console.log('Stripe key exists:', !!stripePublishableKey);

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
      <NavigationContainer>
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
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}
