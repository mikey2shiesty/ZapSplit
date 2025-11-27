import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import ScanScreen from '../screens/main/ScanScreen';
import SplitsScreen from '../screens/main/SplitsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SplitFlowNavigator from './SplitFlowNavigator';
// Lazy load Stripe screens to avoid initialization errors
const ConnectStripeScreen = require('../screens/settings/ConnectStripeScreen').default;
const PaymentHistoryScreen = require('../screens/payments/PaymentHistoryScreen').default;
// Friends & Groups screens
import FriendsScreen from '../screens/friends/FriendsScreen';
import AddFriendScreen from '../screens/friends/AddFriendScreen';
import FriendRequestsScreen from '../screens/friends/FriendRequestsScreen';
import FriendProfileScreen from '../screens/friends/FriendProfileScreen';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
// Notification screens
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/notifications/NotificationSettingsScreen';
// Privacy & Security screens
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import BlockedUsersScreen from '../screens/settings/BlockedUsersScreen';
// Settings & Profile screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Tab Navigator Component
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
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
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'camera' : 'camera-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Splits"
        component={SplitsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Navigator with Modal Stack
export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Split Flow Modal */}
      <Stack.Screen
        name="SplitFlow"
        component={SplitFlowNavigator}
        options={{
          presentation: 'modal', // Modal presentation style (slides up from bottom)
          headerShown: false,
        }}
      />

      {/* Stripe Connect Modal */}
      <Stack.Screen
        name="ConnectStripe"
        component={ConnectStripeScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      {/* Payment History Modal */}
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      {/* Friends Screens */}
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddFriend"
        component={AddFriendScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Groups Screens */}
      <Stack.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Notification Screens */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      {/* Privacy & Security Screens */}
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Settings & Profile Screens */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
