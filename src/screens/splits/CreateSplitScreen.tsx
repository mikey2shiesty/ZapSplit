import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { CreateSplitScreenProps } from '../../types/navigation';
import { colors } from '../../constants/theme';
import {
  AmountInput,
  FriendSelector,
  SplitMethodCard,
  ParticipantRow,
  SplitSummary,
  Friend,
  SplitMethod,
  Participant,
} from '../../components/splits';

export default function CreateSplitScreen({ navigation }: CreateSplitScreenProps) {
  // Test state
  const [amount, setAmount] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');

  // Mock data for testing
  const mockFriends: Friend[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ];

  const mockParticipant: Participant = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    amount_owed: 50.0,
    amount_paid: 50.0,
    status: 'paid',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Component Testing</Text>
        <Text style={styles.subtitle}>All 5 components rendered successfully</Text>

        {/* Test AmountInput */}
        <View style={styles.testSection}>
          <Text style={styles.testLabel}>1. AmountInput</Text>
          <AmountInput value={amount} onChangeValue={setAmount} />
        </View>

        {/* Test SplitMethodCard */}
        <View style={styles.testSection}>
          <Text style={styles.testLabel}>2. SplitMethodCard</Text>
          <SplitMethodCard
            method="equal"
            isSelected={splitMethod === 'equal'}
            onSelect={() => setSplitMethod('equal')}
            totalAmount={100}
            participantCount={2}
          />
        </View>

        {/* Test ParticipantRow */}
        <View style={styles.testSection}>
          <Text style={styles.testLabel}>3. ParticipantRow</Text>
          <ParticipantRow participant={mockParticipant} showStatus />
        </View>

        {/* Test FriendSelector */}
        <View style={styles.testSection}>
          <Text style={styles.testLabel}>4. FriendSelector</Text>
          <View style={{ height: 300 }}>
            <FriendSelector
              friends={mockFriends}
              selectedFriendIds={selectedFriends}
              onToggleFriend={(id) => {
                setSelectedFriends((prev) =>
                  prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                );
              }}
            />
          </View>
        </View>

        {/* Test SplitSummary */}
        <View style={styles.testSection}>
          <Text style={styles.testLabel}>5. SplitSummary</Text>
          <SplitSummary
            title="Team Lunch"
            totalAmount={100}
            participants={[mockParticipant]}
            showProgress
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  testSection: {
    marginBottom: 32,
  },
  testLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
});
