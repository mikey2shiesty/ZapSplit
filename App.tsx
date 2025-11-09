import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
// Temporarily comment out StripeProvider for debugging
// import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // Temporarily disabled StripeProvider for debugging
  // const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  // console.log('Stripe key exists:', !!stripePublishableKey);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
