import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// SwipeableTabScreen — adds a horizontal-pan gesture that jumps between
// adjacent tabs in the parent native bottom tab navigator. Keeps the screen's
// vertical scrolling untouched by requiring 30pt of horizontal travel before
// the gesture activates (`activeOffsetX`), so vertical pans inside the screen
// still pass through to the underlying ScrollView / FlatList.
//
// Threshold: a fling with velocity > 350px/s OR a drag past 80pt switches
// tabs. Below either threshold the gesture is ignored and the swipe just
// snaps back.

interface SwipeableTabScreenProps {
  children: React.ReactNode;
}

const VELOCITY_THRESHOLD = 350;
const TRANSLATION_THRESHOLD = 80;

export default function SwipeableTabScreen({ children }: SwipeableTabScreenProps) {
  const navigation = useNavigation<any>();

  const navigateToAdjacent = (direction: 'next' | 'prev') => {
    const parent = navigation.getParent();
    if (!parent) return;

    const state = parent.getState();
    const currentIndex = state.index;
    const routes = state.routes;

    const nextIndex =
      direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= routes.length) return;

    Haptics.selectionAsync();
    parent.navigate(routes[nextIndex].name);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      const movedLeft =
        e.translationX < -TRANSLATION_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
      const movedRight =
        e.translationX > TRANSLATION_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD;

      if (movedLeft) {
        runOnJS(navigateToAdjacent)('next');
      } else if (movedRight) {
        runOnJS(navigateToAdjacent)('prev');
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}
