import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/theme';

export interface Participant {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  amount_owed: number;
  amount_paid?: number;
  status?: 'pending' | 'paid';
}

interface ParticipantRowProps {
  participant: Participant;
  isEditable?: boolean;
  onAmountChange?: (participantId: string, amount: number) => void;
  onRemove?: (participantId: string) => void;
  showStatus?: boolean;
  isHighlighted?: boolean; // For "You" in review screen
}

export default function ParticipantRow({
  participant,
  isEditable = false,
  onAmountChange,
  onRemove,
  showStatus = false,
  isHighlighted = false,
}: ParticipantRowProps) {
  const [editingAmount, setEditingAmount] = useState(participant.amount_owed.toString());

  const handleAmountChange = (text: string) => {
    setEditingAmount(text);
    const numericValue = parseFloat(text) || 0;
    if (onAmountChange) {
      onAmountChange(participant.id, numericValue);
    }
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onRemove) {
      onRemove(participant.id);
    }
  };

  const getStatusColor = (): string => {
    if (!participant.status) return colors.textSecondary;
    return participant.status === 'paid' ? colors.success : colors.warning;
  };

  const getStatusIcon = () => {
    if (!participant.status) return 'time-outline' as const;
    return participant.status === 'paid' ? 'checkmark-circle' as const : 'time' as const;
  };

  return (
    <View style={[styles.container, isHighlighted && styles.containerHighlighted]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {participant.avatar_url ? (
          <Image source={{ uri: participant.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {participant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{participant.name}</Text>
        {participant.email && (
          <Text style={styles.email}>{participant.email}</Text>
        )}
      </View>

      {/* Amount */}
      {isEditable ? (
        <View style={styles.amountEditContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={editingAmount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.gray400}
          />
        </View>
      ) : (
        <View style={styles.amountDisplayContainer}>
          <Text style={[styles.amountDisplay, isHighlighted && styles.amountHighlighted]}>
            ${participant.amount_owed.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Status Indicator */}
      {showStatus && participant.status && (
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
        </View>
      )}

      {/* Remove Button */}
      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  containerHighlighted: {
    backgroundColor: colors.infoLight,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amountEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 60,
    padding: 0,
  },
  amountDisplayContainer: {
    paddingHorizontal: 12,
  },
  amountDisplay: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  amountHighlighted: {
    color: colors.primary,
  },
  statusContainer: {
    marginLeft: 8,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
});
