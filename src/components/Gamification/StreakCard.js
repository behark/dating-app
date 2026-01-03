import { StyleSheet, Text, View } from 'react-native';

const StreakCard = ({ currentStreak, longestStreak, lastSwipeDate }) => {
  const isStreakActive = () => {
    if (!lastSwipeDate) return false;
    const lastDate = new Date(lastSwipeDate);
    const today = new Date();
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 1;
  };

  return (
    <View style={[styles.card, !isStreakActive() && styles.inactiveCard]}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Swipe Streak</Text>
        {isStreakActive() && <Text style={styles.activeText}>Active</Text>}
      </View>

      <View style={styles.streakContainer}>
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{longestStreak}</Text>
          <Text style={styles.streakLabel}>Longest Streak</Text>
        </View>
      </View>

      {!isStreakActive() && (
        <Text style={styles.warningText}>Come back tomorrow to continue your streak!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF5F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B9D'
  },
  inactiveCard: {
    backgroundColor: '#F5F5F5',
    borderLeftColor: '#CCC'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  activeText: {
    color: '#FF6B9D',
    fontWeight: '600',
    fontSize: 12
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12
  },
  streakInfo: {
    alignItems: 'center',
    flex: 1
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B9D'
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#DDD'
  },
  warningText: {
    marginTop: 12,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic'
  }
});

export default StreakCard;
