import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BadgeShowcase = ({ badges = [] }) => {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [lockedBadges, setLockedBadges] = useState([]);

  useEffect(() => {
    if (badges && Array.isArray(badges)) {
      const unlocked = badges.filter(b => b.isUnlocked);
      const locked = badges.filter(b => !b.isUnlocked);
      setUnlockedBadges(unlocked);
      setLockedBadges(locked);
    }
  }, [badges]);

  const BadgeItem = ({ badge, locked = false }) => (
    <View style={[styles.badgeItem, locked && styles.lockedBadge]}>
      <Text style={styles.badgeIcon}>{badge.badgeIcon}</Text>
      <Text style={[styles.badgeName, locked && styles.lockedText]}>{badge.badgeName}</Text>
      {locked && <Text style={styles.lockedLabel}>Locked</Text>}
      {!locked && badge.unlockedAt && (
        <Text style={styles.unlockedDate}>
          {new Date(badge.unlockedAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Achievement Badges</Text>

      {unlockedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked ({unlockedBadges.length})</Text>
          <View style={styles.badgeGrid}>
            {unlockedBadges.map(badge => (
              <BadgeItem key={badge._id} badge={badge} />
            ))}
          </View>
        </View>
      )}

      {lockedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked ({lockedBadges.length})</Text>
          <View style={styles.badgeGrid}>
            {lockedBadges.map(badge => (
              <BadgeItem key={badge._id} badge={badge} locked />
            ))}
          </View>
        </View>
      )}

      {badges.length === 0 && (
        <Text style={styles.emptyText}>Start using the app to unlock badges!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  lockedBadge: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0'
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: 8
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  lockedText: {
    color: '#999'
  },
  lockedLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic'
  },
  unlockedDate: {
    fontSize: 9,
    color: '#666',
    marginTop: 4
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20
  }
});

export default BadgeShowcase;
