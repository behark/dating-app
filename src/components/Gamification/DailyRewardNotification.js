import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GamificationService from '../../services/GamificationService';

const DailyRewardNotification = ({ userId, onRewardClaimed }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchRewards();
    }
  }, [userId]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await GamificationService.getDailyRewards(userId);
      setRewards(data.unclaimedRewards || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId) => {
    try {
      await GamificationService.claimReward(rewardId);
      setRewards(rewards.filter(r => r._id !== rewardId));
      if (onRewardClaimed) {
        onRewardClaimed();
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
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
      <TouchableOpacity
        style={styles.claimButton}
        onPress={() => handleClaimReward(reward._id)}
      >
        <Text style={styles.claimText}>Claim</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎁 Daily Rewards</Text>
      <FlatList
        data={rewards}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <RewardCard reward={item} />}
        scrollEnabled={false}
      />
      {rewards.length > 1 && (
        <Text style={styles.claimAllText}>
          You have {rewards.length} rewards to claim!
        </Text>
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
    borderLeftColor: '#FFD700'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12
  },
  rewardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  rewardContent: {
    flex: 1
  },
  rewardType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700'
  },
  pointsLabel: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4
  },
  claimButton: {
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12
  },
  claimText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12
  },
  claimAllText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 8
  }
});

export default DailyRewardNotification;
