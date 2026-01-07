import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SwipeCard from '../../../components/Card/SwipeCard';
import SkeletonCard from '../../../components/Card/SkeletonCard';
import EmptyState from '../../../components/Common/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SwipeStack = memo(({
  cards,
  currentIndex,
  loading,
  isGuest,
  onSwipe,
  onCardPress,
  onSuperLike,
  renderOverlay,
  theme,
}) => {
  if (loading) {
    return <SkeletonCard />;
  }

  if (!cards.length || currentIndex >= cards.length) {
    return (
      <EmptyState
        icon="search"
        title="No more profiles"
        subtitle="Check back later or adjust your discovery settings"
      />
    );
  }

  const visibleCards = cards.slice(currentIndex, currentIndex + 3);

  return (
    <View style={styles.container}>
      {visibleCards.map((card, index) => {
        const isTop = index === 0;
        const scale = 1 - index * 0.05;
        const translateY = index * 10;

        return (
          <View
            key={card._id || card.id}
            style={[
              styles.cardWrapper,
              {
                zIndex: visibleCards.length - index,
                transform: [{ scale }, { translateY }],
              },
            ]}
          >
            <SwipeCard
              profile={card}
              isTop={isTop}
              onSwipe={onSwipe}
              onPress={() => onCardPress?.(card)}
              onSuperLike={() => onSuperLike?.(card)}
              disabled={!isTop}
              isDemo={card.isDemo}
            />
          </View>
        );
      })}
      {renderOverlay?.()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH - 20,
  },
});

SwipeStack.displayName = 'SwipeStack';

export default SwipeStack;
