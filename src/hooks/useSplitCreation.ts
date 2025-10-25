import { useState, useCallback } from 'react';
import {
  createSplit,
  validateAmount,
  validateParticipantCount,
  validateTitle,
  validateCustomSplit,
  calculateEqualSplit,
  uploadSplitImage,
  CreateSplitData,
  Split,
} from '../services/splitService';
import { Friend } from '../services/friendService';

export type SplitMethod = 'equal' | 'custom' | 'percentage';

export interface SplitCreationState {
  amount: number;
  title: string;
  description?: string;
  imageUri?: string;
  selectedFriends: Friend[];
  splitMethod: SplitMethod;
  customAmounts: { [participantId: string]: number };
  percentages: { [participantId: string]: number };
}

export function useSplitCreation() {
  const [state, setState] = useState<SplitCreationState>({
    amount: 0,
    title: '',
    description: undefined,
    imageUri: undefined,
    selectedFriends: [],
    splitMethod: 'equal',
    customAmounts: {},
    percentages: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Set amount
   */
  const setAmount = useCallback((amount: number) => {
    setState(prev => ({ ...prev, amount }));
  }, []);

  /**
   * Set title
   */
  const setTitle = useCallback((title: string) => {
    setState(prev => ({ ...prev, title }));
  }, []);

  /**
   * Set description
   */
  const setDescription = useCallback((description: string | undefined) => {
    setState(prev => ({ ...prev, description }));
  }, []);

  /**
   * Set image URI
   */
  const setImageUri = useCallback((imageUri: string | undefined) => {
    setState(prev => ({ ...prev, imageUri }));
  }, []);

  /**
   * Set selected friends
   */
  const setSelectedFriends = useCallback((friends: Friend[]) => {
    setState(prev => ({ ...prev, selectedFriends: friends }));
  }, []);

  /**
   * Set split method
   */
  const setSplitMethod = useCallback((method: SplitMethod) => {
    setState(prev => ({ ...prev, splitMethod: method }));
  }, []);

  /**
   * Set custom amounts for participants
   */
  const setCustomAmounts = useCallback((amounts: { [participantId: string]: number }) => {
    setState(prev => ({ ...prev, customAmounts: amounts }));
  }, []);

  /**
   * Set percentages for participants
   */
  const setPercentages = useCallback((percentages: { [participantId: string]: number }) => {
    setState(prev => ({ ...prev, percentages: percentages }));
  }, []);

  /**
   * Validate current state
   */
  const validate = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate amount
    if (!validateAmount(state.amount)) {
      errors.push('Amount must be greater than 0');
    }

    // Validate title
    const titleValidation = validateTitle(state.title);
    if (!titleValidation.valid) {
      errors.push(titleValidation.error!);
    }

    // Validate participants (including creator = +1)
    if (!validateParticipantCount(state.selectedFriends.length + 1)) {
      errors.push('At least one other person must be selected');
    }

    // Validate custom amounts if custom split method
    if (state.splitMethod === 'custom') {
      const validation = validateCustomSplit(state.customAmounts, state.amount);
      if (!validation.valid) {
        errors.push(`Custom amounts must equal total (off by $${Math.abs(validation.difference).toFixed(2)})`);
      }
    }

    // Validate percentages if percentage split method
    if (state.splitMethod === 'percentage') {
      const totalPercentage = Object.values(state.percentages).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push(`Percentages must equal 100% (currently ${totalPercentage.toFixed(1)}%)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [state]);

  /**
   * Create the split in the database
   */
  const submitSplit = useCallback(async (currentUserId: string): Promise<Split> => {
    try {
      setLoading(true);
      setError(null);

      // Validate first
      const validation = validate();
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Calculate participant amounts based on split method
      const participants: { user_id: string; amount_owed: number }[] = [];

      // Add creator as participant
      let creatorAmount = 0;

      if (state.splitMethod === 'equal') {
        const equalAmount = calculateEqualSplit(
          state.amount,
          state.selectedFriends.length + 1
        );
        creatorAmount = equalAmount;

        // Add friends with equal amounts
        state.selectedFriends.forEach(friend => {
          participants.push({
            user_id: friend.id,
            amount_owed: equalAmount,
          });
        });
      } else if (state.splitMethod === 'custom') {
        creatorAmount = state.customAmounts[currentUserId] || 0;

        // Add friends with custom amounts
        state.selectedFriends.forEach(friend => {
          participants.push({
            user_id: friend.id,
            amount_owed: state.customAmounts[friend.id] || 0,
          });
        });
      } else if (state.splitMethod === 'percentage') {
        const creatorPercentage = state.percentages[currentUserId] || 0;
        creatorAmount = Math.round((state.amount * creatorPercentage / 100) * 100) / 100;

        // Add friends with percentage-based amounts
        state.selectedFriends.forEach(friend => {
          const percentage = state.percentages[friend.id] || 0;
          const amount = Math.round((state.amount * percentage / 100) * 100) / 100;
          participants.push({
            user_id: friend.id,
            amount_owed: amount,
          });
        });
      }

      // Add creator to participants
      participants.push({
        user_id: currentUserId,
        amount_owed: creatorAmount,
      });

      // Upload image if provided
      let imageUrl: string | undefined;
      if (state.imageUri) {
        try {
          imageUrl = await uploadSplitImage(state.imageUri, 'temp-split-id');
        } catch (err) {
          console.error('Error uploading image:', err);
          // Continue without image if upload fails
        }
      }

      // Create split data
      const splitData: CreateSplitData = {
        title: state.title.trim(),
        description: state.description?.trim(),
        total_amount: state.amount,
        currency: 'AUD',
        split_method: state.splitMethod,
        participants,
        image_url: imageUrl,
      };

      // Create split in database
      const split = await createSplit(splitData);

      // Reset state after successful creation
      reset();

      return split;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create split';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state, validate]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState({
      amount: 0,
      title: '',
      description: undefined,
      imageUri: undefined,
      selectedFriends: [],
      splitMethod: 'equal',
      customAmounts: {},
      percentages: {},
    });
    setError(null);
  }, []);

  return {
    // State
    amount: state.amount,
    title: state.title,
    description: state.description,
    imageUri: state.imageUri,
    selectedFriends: state.selectedFriends,
    splitMethod: state.splitMethod,
    customAmounts: state.customAmounts,
    percentages: state.percentages,
    loading,
    error,

    // Actions
    setAmount,
    setTitle,
    setDescription,
    setImageUri,
    setSelectedFriends,
    setSplitMethod,
    setCustomAmounts,
    setPercentages,
    validate,
    submitSplit,
    reset,
  };
}
