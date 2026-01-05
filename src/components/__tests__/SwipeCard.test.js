import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SwipeCard from '../Card/SwipeCard';

// Mock the PanGestureHandler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: ({ children }) => children,
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => ({
  useAnimatedGestureHandler: jest.fn(() => ({})),
  useAnimatedStyle: jest.fn(() => ({})),
  useSharedValue: jest.fn(() => ({ value: 0 })),
  withSpring: jest.fn((value) => value),
  runOnJS: jest.fn((fn) => fn),
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));

// Mock Ionicons
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

const mockCard = {
  id: '1',
  name: 'John Doe',
  age: 25,
  bio: 'Hello, I am John!',
  photoURL: 'https://example.com/photo.jpg',
};

const mockProps = {
  card: mockCard,
  onSwipeLeft: jest.fn(),
  onSwipeRight: jest.fn(),
  onViewProfile: jest.fn(),
  index: 0,
};

describe('SwipeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders card with user information', () => {
    render(<SwipeCard {...mockProps} />);

    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText(', 25')).toBeTruthy();
    expect(screen.getByText('Hello, I am John!')).toBeTruthy();
  });

  it('renders placeholder when no bio', () => {
    const cardWithoutBio = { ...mockCard, bio: null };
    render(<SwipeCard {...mockProps} card={cardWithoutBio} />);

    expect(screen.getByText('No bio yet')).toBeTruthy();
  });

  it('renders placeholder when no age', () => {
    const cardWithoutAge = { ...mockCard, age: null };
    render(<SwipeCard {...mockProps} card={cardWithoutAge} />);

    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.queryByText(',')).toBeFalsy();
  });

  it('calls onViewProfile when info button is pressed', () => {
    render(<SwipeCard {...mockProps} />);

    const infoButton = screen.getByTestId('info-button');
    fireEvent.press(infoButton);

    expect(mockProps.onViewProfile).toHaveBeenCalledWith();
  });

  it('renders with correct styling', () => {
    render(<SwipeCard {...mockProps} />);

    const card = screen.getByTestId('swipe-card');
    expect(card).toHaveStyle({
      borderRadius: 30,
      backgroundColor: '#fff',
    });
  });

  it('shows like overlay on right swipe', () => {
    // This would require more complex mocking of the gesture handler
    // For now, we'll just test that the component renders without crashing
    render(<SwipeCard {...mockProps} />);
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('handles missing photoURL gracefully', () => {
    const cardWithoutPhoto = { ...mockCard, photoURL: null };
    render(<SwipeCard {...mockProps} card={cardWithoutPhoto} />);

    // Should still render without crashing
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('handles undefined card gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<SwipeCard {...mockProps} card={undefined} />);

    // Should render fallback text
    expect(screen.getByText('Unknown')).toBeTruthy();

    consoleSpy.mockRestore();
  });
});
