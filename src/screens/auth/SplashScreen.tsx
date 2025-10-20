import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';
import { supabase } from '../../services/supabase';

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Minimum splash display time for better UX
      const minDisplayTime = new Promise(resolve => setTimeout(resolve, 1500));

      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      // Wait for minimum display time
      await minDisplayTime;

      // Navigate based on auth status
      onFinish(!!session);
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, assume not authenticated
      onFinish(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
