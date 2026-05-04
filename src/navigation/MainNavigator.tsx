import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
// `@react-navigation/bottom-tabs/unstable` exposes the native bottom tab
// navigator that wraps UITabBarController on iOS — the only path to the real
// iOS 26 Liquid Glass tab bar (per Apple HIG: items rest on a Liquid Glass
// background that the system controls). Falls back to a JS implementation on
// Android / older iOS automatically.
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
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
import AddGroupMembersScreen from '../screens/groups/AddGroupMembersScreen';
// Notification screens
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/notifications/NotificationSettingsScreen';
// Privacy & Security screens
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import BlockedUsersScreen from '../screens/settings/BlockedUsersScreen';
// Legal & Compliance screens
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/settings/TermsOfServiceScreen';
import DeleteAccountScreen from '../screens/settings/DeleteAccountScreen';
// Settings & Profile screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
// Analytics
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createNativeBottomTabNavigator<MainTabParamList>();

// MainTabs — uses the official `createNativeBottomTabNavigator`. iOS gets
// UITabBarController (real iOS 26 Liquid Glass on iOS 26+ / Xcode 26 builds,
// real native iOS 18-style bar otherwise). Android gets BottomNavigationView.
// SF Symbols on iOS, materialSymbol equivalents on Android. The system handles
// content insets, blur, fill/outline icon transitions, and minimize-on-scroll.
function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        // iOS 26: bar minimizes to the active tab when scrolling down (Music
        // app behaviour). Auto-falls back to no-op on iOS 18.
        tabBarMinimizeBehavior: 'onScrollDown',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'house' },
            android: { type: 'materialSymbol', name: 'home' },
            default: undefined,
          }) as any,
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'camera' },
            android: { type: 'materialSymbol', name: 'photo_camera' },
            default: undefined,
          }) as any,
        }}
      />
      <Tab.Screen
        name="Splits"
        component={SplitsScreen}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'list.bullet.rectangle' },
            android: { type: 'materialSymbol', name: 'receipt_long' },
            default: undefined,
          }) as any,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: Platform.select({
            ios: { type: 'sfSymbol', name: 'person.crop.circle' },
            android: { type: 'materialSymbol', name: 'person' },
            default: undefined,
          }) as any,
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

      {/* Split Flow */}
      <Stack.Screen
        name="SplitFlow"
        component={SplitFlowNavigator}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Stripe Connect */}
      <Stack.Screen
        name="ConnectStripe"
        component={ConnectStripeScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Payment History */}
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{
          presentation: 'card',
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
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{
          presentation: 'card',
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
          presentation: 'card',
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
      <Stack.Screen
        name="AddGroupMembers"
        component={AddGroupMembersScreen}
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
          presentation: 'card',
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

      {/* Legal & Compliance Screens */}
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
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
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Analytics */}
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
