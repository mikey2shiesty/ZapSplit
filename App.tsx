import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const stripePublishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
                                 process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  if (!stripePublishableKey) {
    console.warn('Stripe publishable key not found. Payment features will not work.');
  }

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}
