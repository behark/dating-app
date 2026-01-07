import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Custom hook for managing card decks/stacks in discovery screens
 *
 * Features:
 * - Efficient card management with pagination
 * - Card preloading for smooth UX
 * - Automatic cleanup of processed cards
 * - Consistent card indexing
 * - Memory optimization
 */
export const useCardDeck = ({
  initialCards = [],
  preloadCount = 3,
  maxCardsInMemory = 10,
  onCardsExhausted,
}) => {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const processedCardsRef = useRef(new Set());

  // Calculate visible cards (current + preloaded)
  const visibleCards = useMemo(() => {
    const startIndex = Math.max(0, currentIndex - 1); // Include previous card for undo
    const endIndex = Math.min(cards.length, currentIndex + preloadCount + 1);
    return cards.slice(startIndex, endIndex);
  }, [cards, currentIndex, preloadCount]);

  // Check if we need to load more cards
  const shouldLoadMore = useMemo(() => {
    return cards.length - currentIndex <= preloadCount && !isLoading;
  }, [cards.length, currentIndex, preloadCount, isLoading]);

  // Get current card
  const currentCard = useMemo(() => {
    return currentIndex < cards.length ? cards[currentIndex] : null;
  }, [cards, currentIndex]);

  // Get next card (for preloading)
  const nextCard = useMemo(() => {
    const nextIndex = currentIndex + 1;
    return nextIndex < cards.length ? cards[nextIndex] : null;
  }, [cards, currentIndex]);

  /**
   * Add new cards to the deck
   */
  const addCards = useCallback((newCards) => {
    setCards(prevCards => {
      // Avoid duplicates
      const existingIds = new Set(prevCards.map(card => card.id || card._id));
      const filteredNewCards = newCards.filter(card =>
        !existingIds.has(card.id || card._id)
      );

      const updatedCards = [...prevCards, ...filteredNewCards];

      // Limit memory usage by keeping only recent cards
      if (updatedCards.length > maxCardsInMemory) {
        const keepFromIndex = Math.max(0, currentIndex - 5);
        return updatedCards.slice(keepFromIndex);
      }

      return updatedCards;
    });
  }, [currentIndex, maxCardsInMemory]);

  /**
   * Move to next card
   */
  const next = useCallback(() => {
    if (currentIndex >= cards.length - 1) {
      onCardsExhausted?.();
      return false;
    }

    const card = cards[currentIndex];
    if (card) {
      processedCardsRef.current.add(card.id || card._id);
    }

    setCurrentIndex(prev => prev + 1);
    return true;
  }, [cards, currentIndex, onCardsExhausted]);

  /**
   * Move to previous card (undo)
   */
  const previous = useCallback(() => {
    if (currentIndex <= 0) return false;

    setCurrentIndex(prev => prev - 1);
    return true;
  }, [currentIndex]);

  /**
   * Jump to specific card index
   */
  const jumpTo = useCallback((index) => {
    if (index < 0 || index >= cards.length) return false;

    setCurrentIndex(index);
    return true;
  }, [cards.length]);

  /**
   * Reset deck to beginning
   */
  const reset = useCallback(() => {
    setCurrentIndex(0);
    processedCardsRef.current.clear();
  }, []);

  /**
   * Shuffle remaining cards
   */
  const shuffle = useCallback(() => {
    setCards(prevCards => {
      const remaining = prevCards.slice(currentIndex);
      const processed = prevCards.slice(0, currentIndex);

      // Fisher-Yates shuffle
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }

      return [...processed, ...remaining];
    });
  }, [currentIndex]);

  /**
   * Remove specific card from deck
   */
  const removeCard = useCallback((cardId) => {
    setCards(prevCards => {
      const filtered = prevCards.filter(card => (card.id || card._id) !== cardId);

      // Adjust current index if necessary
      if (currentIndex >= filtered.length && filtered.length > 0) {
        setCurrentIndex(filtered.length - 1);
      }

      return filtered;
    });
  }, [currentIndex]);

  /**
   * Get deck statistics
   */
  const getStats = useCallback(() => {
    return {
      total: cards.length,
      current: currentIndex,
      remaining: Math.max(0, cards.length - currentIndex),
      processed: processedCardsRef.current.size,
      visible: visibleCards.length,
    };
  }, [cards.length, currentIndex, visibleCards.length]);

  /**
   * Check if deck is empty
   */
  const isEmpty = useMemo(() => {
    return cards.length === 0;
  }, [cards.length]);

  /**
   * Check if at end of deck
   */
  const isAtEnd = useMemo(() => {
    return currentIndex >= cards.length - 1;
  }, [currentIndex, cards.length]);

  return {
    // State
    cards: visibleCards,
    currentCard,
    nextCard,
    currentIndex,
    isLoading,
    isEmpty,
    isAtEnd,
    shouldLoadMore,

    // Actions
    addCards,
    next,
    previous,
    jumpTo,
    reset,
    shuffle,
    removeCard,

    // Utilities
    getStats,
    setLoading: setIsLoading,
  };
};

export default useCardDeck;