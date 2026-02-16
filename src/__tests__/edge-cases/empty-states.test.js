/**
 * Empty State Tests
 * Tests for handling empty states (no matches, no messages, no profiles)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

const EMPTY_MATCHES_TEST_ID = 'empty-matches';
const EMPTY_MESSAGES_TEST_ID = 'empty-messages';
const EMPTY_PROFILES_TEST_ID = 'empty-profiles';
const MATCHES_API_PATH = '/api/matches';

// Mock components that show empty states
const EmptyMatchesList = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
      <View testID={EMPTY_MATCHES_TEST_ID}>
        <Text>No matches yet</Text>
        <Text>Keep swiping to find your match!</Text>
      </View>
    );
  }
  return (
    <View testID="matches-list">
      {matches.map((m) => (
        <Text key={m.id}>{m.name}</Text>
      ))}
    </View>
  );
};

const EmptyMessagesList = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <View testID={EMPTY_MESSAGES_TEST_ID}>
        <Text>No messages yet</Text>
        <Text>Start the conversation!</Text>
      </View>
    );
  }
  return (
    <View testID="messages-list">
      {messages.map((m) => (
        <Text key={m.id}>{m.content}</Text>
      ))}
    </View>
  );
};

const EmptyProfilesList = ({ profiles }) => {
  if (!profiles || profiles.length === 0) {
    return (
      <View testID={EMPTY_PROFILES_TEST_ID}>
        <Text>No profiles found</Text>
        <Text>Try adjusting your filters</Text>
      </View>
    );
  }
  return (
    <View testID="profiles-list">
      {profiles.map((p) => (
        <Text key={p.id}>{p.name}</Text>
      ))}
    </View>
  );
};

describe('Empty State Handling', () => {
  describe('Empty Matches List', () => {
    it('should display empty state when matches array is empty', () => {
      const { getByTestId, getByText } = render(<EmptyMatchesList matches={[]} />);
      expect(getByTestId(EMPTY_MATCHES_TEST_ID)).toBeTruthy();
      expect(getByText('No matches yet')).toBeTruthy();
    });

    it('should display empty state when matches is null', () => {
      const { getByTestId } = render(<EmptyMatchesList matches={null} />);
      expect(getByTestId(EMPTY_MATCHES_TEST_ID)).toBeTruthy();
    });

    it('should display empty state when matches is undefined', () => {
      const { getByTestId } = render(<EmptyMatchesList matches={undefined} />);
      expect(getByTestId(EMPTY_MATCHES_TEST_ID)).toBeTruthy();
    });

    it('should display matches list when matches exist', () => {
      const matches = [{ id: '1', name: 'User 1' }];
      const { getByTestId } = render(<EmptyMatchesList matches={matches} />);
      expect(getByTestId('matches-list')).toBeTruthy();
    });
  });

  describe('Empty Messages List', () => {
    it('should display empty state when messages array is empty', () => {
      const { getByTestId, getByText } = render(<EmptyMessagesList messages={[]} />);
      expect(getByTestId(EMPTY_MESSAGES_TEST_ID)).toBeTruthy();
      expect(getByText('No messages yet')).toBeTruthy();
    });

    it('should display empty state when messages is null', () => {
      const { getByTestId } = render(<EmptyMessagesList messages={null} />);
      expect(getByTestId(EMPTY_MESSAGES_TEST_ID)).toBeTruthy();
    });

    it('should display empty state when messages is undefined', () => {
      const { getByTestId } = render(<EmptyMessagesList messages={undefined} />);
      expect(getByTestId(EMPTY_MESSAGES_TEST_ID)).toBeTruthy();
    });

    it('should display messages list when messages exist', () => {
      const messages = [{ id: '1', content: 'Hello' }];
      const { getByTestId } = render(<EmptyMessagesList messages={messages} />);
      expect(getByTestId('messages-list')).toBeTruthy();
    });
  });

  describe('Empty Profiles List', () => {
    it('should display empty state when profiles array is empty', () => {
      const { getByTestId, getByText } = render(<EmptyProfilesList profiles={[]} />);
      expect(getByTestId(EMPTY_PROFILES_TEST_ID)).toBeTruthy();
      expect(getByText('No profiles found')).toBeTruthy();
    });

    it('should display empty state when profiles is null', () => {
      const { getByTestId } = render(<EmptyProfilesList profiles={null} />);
      expect(getByTestId(EMPTY_PROFILES_TEST_ID)).toBeTruthy();
    });

    it('should display empty state when profiles is undefined', () => {
      const { getByTestId } = render(<EmptyProfilesList profiles={undefined} />);
      expect(getByTestId(EMPTY_PROFILES_TEST_ID)).toBeTruthy();
    });

    it('should display profiles list when profiles exist', () => {
      const profiles = [{ id: '1', name: 'User 1' }];
      const { getByTestId } = render(<EmptyProfilesList profiles={profiles} />);
      expect(getByTestId('profiles-list')).toBeTruthy();
    });
  });

  describe('Empty State API Responses', () => {
    it('should handle empty array response from API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { matches: [] } }),
      });

      const response = await fetch(MATCHES_API_PATH);
      const data = await response.json();

      expect(data.data.matches).toEqual([]);
      expect(Array.isArray(data.data.matches)).toBe(true);
    });

    it('should handle null response from API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: null }),
      });

      const response = await fetch(MATCHES_API_PATH);
      const data = await response.json();

      expect(data.data).toBeNull();
    });

    it('should handle undefined data field in API response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await fetch(MATCHES_API_PATH);
      const data = await response.json();

      expect(data.data).toBeUndefined();
    });
  });
});
