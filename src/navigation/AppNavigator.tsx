import React, { useState } from 'react';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/main/HomeScreen';

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSplashFinish = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return isAuthenticated ? <HomeScreen /> : <AuthNavigator />;
}
