import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import ScanScreen from '../screens/main/ScanScreen';
import SplitsScreen from '../screens/main/SplitsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { colors, shadows } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          ...shadows.low,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🏠" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="📸" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Splits"
        component={SplitsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="💰" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="👤" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Custom Tab Icon Component with PayPal-style indicator
function TabIcon({ icon, focused, color }: { icon: string; focused: boolean; color: string }) {
  const { View, Text } = require('react-native');

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 28 : 24, opacity: focused ? 1 : 0.6 }}>
        {icon}
      </Text>
      {focused && (
        <View
          style={{
            width: 32,
            height: 3,
            backgroundColor: color,
            borderRadius: 2,
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}
