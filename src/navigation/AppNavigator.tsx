import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/main/HomeScreen';
import { colors } from '../constants/theme';

export default function AppNavigator() {
  const { session, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for minimum time for better UX
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Show splash while initial auth check is loading or during minimum display time
  if (loading || showSplash) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Navigate based on auth state - this will automatically update when auth changes!
  return session ? <HomeScreen /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
