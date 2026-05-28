import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import StripeOnboardingScreen from '../screens/onboarding/StripeOnboardingScreen';
import NameOnboardingScreen from '../screens/onboarding/NameOnboardingScreen';

export default function AppNavigator() {
  const { session, user, loading } = useAuth();
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showNameOnboarding, setShowNameOnboarding] = useState(false);
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
        // Check profile for name and Stripe setup
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_onboarding_dismissed')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (error || !profile) {
          setShowNameOnboarding(false);
          setShowOnboarding(false);
          setOnboardingChecked(true);
          return;
        }

        // Per App Store guideline 4 (Sign in with Apple design): we must
        // never re-prompt for info Apple already provided. Apple only returns
        // the name on the very first sign-in, and only when the user accepts
        // the default — if they hide it, or if they re-sign-in after a
        // local user wipe without revoking in iOS Settings, the credential
        // has no name. Either way we are forbidden from asking again.
        const providers = [
          (user.app_metadata?.provider as string | undefined),
          ...((user.app_metadata?.providers as string[] | undefined) ?? []),
        ].filter(Boolean);
        const signedInWithApple = providers.includes('apple');

        const profileName = profile.full_name?.trim() ?? '';
        const metaName = (user.user_metadata?.full_name as string | undefined)?.trim() ?? '';

        if (!profileName && metaName) {
          await supabase.from('profiles').update({ full_name: metaName }).eq('id', user.id);
        }

        const needsName = !signedInWithApple && !profileName && !metaName;
        setShowNameOnboarding(needsName);

        // Show Stripe onboarding if user hasn't set up Stripe and hasn't dismissed
        const shouldShow =
          !profile.stripe_connect_account_id &&
          !profile.stripe_connect_onboarding_complete &&
          !profile.stripe_onboarding_dismissed;

        setShowOnboarding(shouldShow);
        setOnboardingChecked(true);
      } catch {
        if (!cancelled) {
          setShowNameOnboarding(false);
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

  if (showNameOnboarding) {
    return <NameOnboardingScreen userId={user!.id} onComplete={() => setShowNameOnboarding(false)} />;
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
