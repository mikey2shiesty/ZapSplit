import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SplitFlowParamList } from '../types/navigation';
import { colors } from '../constants/theme';

// Import split flow screens
import CreateSplitScreen from '../screens/splits/CreateSplitScreen';
import ScanReceiptScreen from '../screens/splits/ScanReceiptScreen';
import ReviewReceiptScreen from '../screens/splits/ReviewReceiptScreen';
import ItemAssignmentScreen from '../screens/splits/ItemAssignmentScreen';
import PaymentRequestScreen from '../screens/splits/PaymentRequestScreen';
// Temporarily commented out to debug
// import PayScreen from '../screens/splits/PayScreen';
import SplitDetailScreen from '../screens/splits/SplitDetailScreen';
import SelectFriendsScreen from '../screens/splits/SelectFriendsScreen';
import SplitMethodScreen from '../screens/splits/SplitMethodScreen';
import CustomAmountsScreen from '../screens/splits/CustomAmountsScreen';
import ReviewSplitScreen from '../screens/splits/ReviewSplitScreen';
import SplitSuccessScreen from '../screens/splits/SplitSuccessScreen';

const Stack = createStackNavigator<SplitFlowParamList>();

export default function SplitFlowNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerBackTitleVisible: false, // Hide "Back" text on iOS
        cardStyle: {
          backgroundColor: colors.background,
        },
        presentation: 'card', // Smooth card-style transitions
      }}
    >
      <Stack.Screen
        name="CreateSplit"
        component={CreateSplitScreen}
        options={({ navigation }) => ({
          title: 'New Split',
          headerLeft: () => null, // Remove back button on first screen
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.goBack()}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="close" size={28} color={colors.gray700} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ScanReceipt"
        component={ScanReceiptScreen}
        options={{
          headerShown: false, // Hide header for full-screen camera
        }}
      />
      <Stack.Screen
        name="ReviewReceipt"
        component={ReviewReceiptScreen}
        options={{
          title: 'Review Receipt',
          headerShown: false, // Custom header in screen
        }}
      />
      <Stack.Screen
        name="ItemAssignment"
        component={ItemAssignmentScreen}
        options={{
          title: 'Item Assignment',
          headerShown: false, // Custom header in screen
        }}
      />
      <Stack.Screen
        name="SelectFriends"
        component={SelectFriendsScreen}
        options={{
          title: 'Select Friends',
        }}
      />
      <Stack.Screen
        name="SplitMethod"
        component={SplitMethodScreen}
        options={{
          title: 'Split Method',
        }}
      />
      <Stack.Screen
        name="CustomAmounts"
        component={CustomAmountsScreen}
        options={{
          title: 'Custom Amounts',
        }}
      />
      <Stack.Screen
        name="ReviewSplit"
        component={ReviewSplitScreen}
        options={{
          title: 'Review',
        }}
      />
      <Stack.Screen
        name="PaymentRequest"
        component={PaymentRequestScreen}
        options={{
          title: 'Payment Request',
          headerShown: false, // Custom header in screen
        }}
      />
      {/* Temporarily commented out to debug */}
      {/* <Stack.Screen
        name="PayScreen"
        component={PayScreen}
        options={{
          title: 'Pay with Card',
          headerShown: false, // Custom header in screen
        }}
      /> */}
      <Stack.Screen
        name="SplitDetail"
        component={SplitDetailScreen}
        options={{
          title: 'Split Details',
          headerShown: false, // Custom header in screen
        }}
      />
      <Stack.Screen
        name="SplitSuccess"
        component={SplitSuccessScreen}
        options={{
          headerShown: false, // Hide header on success screen for cleaner look
        }}
      />
    </Stack.Navigator>
  );
}
