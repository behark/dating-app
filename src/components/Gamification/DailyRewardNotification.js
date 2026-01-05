import { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { GamificationService } from '../../services/GamificationService';
import logger from '../../utils/logger';

const DailyRewardNotification = ({ userId, onRewardClaimed }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await GamificationService.getDailyRewards(userId);
      setRewards(data.unclaimedRewards || []);
    } catch (error) {
      logger.error('Error fetching rewards', error, { userId });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRewards();
    }
  }, [userId, fetchRewards]);

  const handleClaimReward = async (rewardId) => {
    try {
      await GamificationService.claimReward(rewardId);
      setRewards(rewards.filter((r) => r._id !== rewardId));
      if (onRewardClaimed) {
        onRewardClaimed();
      }
    } catch (error) {
      logger.error('Error claiming reward', error, { userId, rewardId });
    }
  };

  if (rewards.length === 0) {
    return null;
  }

  const RewardCard = ({ reward }) => (
    <View style={styles.rewardCard}>
      <View style={styles.rewardContent}>
        <Text style={styles.rewardType}>{reward.rewardDescription}</Text>
        <View style={styles.rewardValue}>
          <Text style={styles.points}>+{reward.rewardValue}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.claimButton} onPress={() => handleClaimReward(reward._id)}>
        <Text style={styles.claimText}>Claim</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎁 Daily Rewards</Text>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RewardCard reward={item} />}
        scrollEnabled={false}
      />
      {rewards.length > 1 && (
        <Text style={styles.claimAllText}>You have {rewards.length} rewards to claim!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFAF0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.gold,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
  },
  rewardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: Colors.text.primary,
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rewardContent: {
    flex: 1,
  },
  rewardType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.accent.gold,
  },
  pointsLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  claimButton: {
    backgroundColor: Colors.accent.gold,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
  },
  claimText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 12,
  },
  claimAllText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 8,
  },
});

export default DailyRewardNotification;
