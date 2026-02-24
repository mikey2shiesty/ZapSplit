import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import StripeOnboardingScreen from '../screens/onboarding/StripeOnboardingScreen';

export default function AppNavigator() {
  const { session, user, loading } = useAuth();
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Check if Stripe onboarding should be shown after auth resolves
  useEffect(() => {
    if (!session || !user || loading) {
      setOnboardingChecked(false);
      setShowOnboarding(false);
      return;
    }

    let cancelled = false;

    const checkOnboarding = async () => {
      try {
        // Check profile for existing Stripe setup or prior dismissal
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_onboarding_dismissed')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (error || !profile) {
          // On error, skip onboarding to avoid blocking the user
          setShowOnboarding(false);
          setOnboardingChecked(true);
          return;
        }

        // Show onboarding if user hasn't set up Stripe and hasn't dismissed the prompt
        const shouldShow =
          !profile.stripe_connect_account_id &&
          !profile.stripe_connect_onboarding_complete &&
          !profile.stripe_onboarding_dismissed;

        setShowOnboarding(shouldShow);
        setOnboardingChecked(true);
      } catch {
        // On any error, skip onboarding
        if (!cancelled) {
          setShowOnboarding(false);
          setOnboardingChecked(true);
        }
      }
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [session, user, loading]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  // Show splash while initial auth check is loading or during minimum display time
  if (loading || showSplash) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.gray50 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <AuthNavigator />;
  }

  // Wait for onboarding check before rendering main content
  if (!onboardingChecked) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.gray50 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return <StripeOnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <MainNavigator />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
