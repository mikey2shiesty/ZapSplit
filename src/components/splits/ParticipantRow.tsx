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
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

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
  const { colors } = useTheme();
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
    <View style={[
      styles.container,
      {
        backgroundColor: isHighlighted ? colors.primaryLight : colors.surface,
        borderColor: isHighlighted ? colors.primary : colors.gray200,
        borderWidth: isHighlighted ? 2 : 1,
      }
    ]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {participant.avatar_url ? (
          <Image source={{ uri: participant.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {participant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.gray900 }]}>{participant.name}</Text>
        {participant.email && (
          <Text style={[styles.email, { color: colors.gray500 }]}>{participant.email}</Text>
        )}
      </View>

      {/* Amount */}
      {isEditable ? (
        <View style={[
          styles.amountEditContainer,
          { backgroundColor: colors.gray100, borderColor: colors.gray300 }
        ]}>
          <Text style={[styles.currencySymbol, { color: colors.gray500 }]}>$</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.gray900 }]}
            value={editingAmount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.gray400}
          />
        </View>
      ) : (
        <View style={styles.amountDisplayContainer}>
          <Text style={[
            styles.amountDisplay,
            { color: isHighlighted ? colors.primary : colors.gray900 }
          ]}>
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
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
  },
  amountEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 60,
    padding: 0,
  },
  amountDisplayContainer: {
    paddingHorizontal: spacing.sm,
  },
  amountDisplay: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusContainer: {
    marginLeft: spacing.xs,
  },
  removeButton: {
    marginLeft: spacing.xs,
    padding: 4,
  },
});
