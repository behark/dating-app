import { useEffect, useState } from 'react';
import { Colors } from '../constants/colors';
import { StyleSheet, Text, View } from 'react-native';

const BadgeShowcase = ({ badges = [] }) => {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [lockedBadges, setLockedBadges] = useState([]);

  useEffect(() => {
    if (badges && Array.isArray(badges)) {
      const unlocked = badges.filter((b) => b.isUnlocked);
      const locked = badges.filter((b) => !b.isUnlocked);
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
        <Text style={styles.unlockedDate}>{new Date(badge.unlockedAt).toLocaleDateString()}</Text>
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
            {unlockedBadges.map((badge) => (
              <BadgeItem key={badge._id} badge={badge} />
            ))}
          </View>
        </View>
      )}

      {lockedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked ({lockedBadges.length})</Text>
          <View style={styles.badgeGrid}>
            {lockedBadges.map((badge) => (
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.background.white,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: Colors.text.primary,
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  lockedBadge: {
    opacity: 0.6,
    backgroundColor: Colors.background.light,
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.dark,
    textAlign: 'center',
  },
  lockedText: {
    color: Colors.text.tertiary,
  },
  lockedLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  unlockedDate: {
    fontSize: 9,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    paddingVertical: 20,
  },
});

export default BadgeShowcase;
