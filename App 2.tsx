import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  console.log('Stripe key exists:', !!stripePublishableKey);

  if (!stripePublishableKey) {
    console.warn('⚠️ Stripe publishable key not found. Payment features will not work.');
    return (
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );
  }

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}
