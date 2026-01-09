import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';

const MessageScheduler = ({
  visible,
  onClose,
  onSchedule,
  matchName = 'your match',
  initialMessage = '',
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 3600000)); // 1 hour from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [reminderBefore, setReminderBefore] = useState(true);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setScheduledDate(newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setScheduledDate(newDate);
    }
  };

  const validateSchedule = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message to schedule.');
      return false;
    }

    if (scheduledDate <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time.');
      return false;
    }

    return true;
  };

  const handleSchedule = () => {
    if (!validateSchedule()) return;

    onSchedule?.({
      message: message.trim(),
      scheduledAt: scheduledDate.toISOString(),
      repeatDaily,
      reminderBefore,
    });

    // Reset form
    setMessage('');
    setScheduledDate(new Date(Date.now() + 3600000));
    setRepeatDaily(false);
    onClose?.();
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const quickScheduleOptions = [
    { label: 'In 1 hour', hours: 1 },
    { label: 'Tonight at 8 PM', time: { hours: 20, minutes: 0 } },
    { label: 'Tomorrow morning', time: { hours: 9, minutes: 0 }, addDays: 1 },
    { label: 'This weekend', dayOfWeek: 6 }, // Saturday
  ];

  const handleQuickSchedule = (option) => {
    const newDate = new Date();

    if (option.hours) {
      newDate.setTime(newDate.getTime() + option.hours * 3600000);
    } else if (option.time) {
      if (option.addDays) {
        newDate.setDate(newDate.getDate() + option.addDays);
      }
      newDate.setHours(option.time.hours, option.time.minutes, 0, 0);
    } else if (option.dayOfWeek !== undefined) {
      const currentDay = newDate.getDay();
      const daysUntilTarget = (option.dayOfWeek - currentDay + 7) % 7 || 7;
      newDate.setDate(newDate.getDate() + daysUntilTarget);
      newDate.setHours(10, 0, 0, 0);
    }

    setScheduledDate(newDate);
  };

  const suggestedMessages = [
    `Hey! Hope you're having a great day 😊`,
    `Good morning! Just thinking about you ☀️`,
    `How's your day going? Would love to catch up!`,
    `Miss chatting with you! Free to talk later?`,
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Schedule Message</Text>
              <Text style={styles.subtitle}>Send to {matchName} later</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.dark} />
            </TouchableOpacity>
          </View>

          {/* Message input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your message</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor={Colors.text.tertiary}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>

          {/* Suggested messages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick suggestions</Text>
            <View style={styles.suggestionsContainer}>
              {suggestedMessages.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionPill}
                  onPress={() => setMessage(suggestion)}
                >
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick schedule options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick schedule</Text>
            <View style={styles.quickOptionsContainer}>
              {quickScheduleOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickOption}
                  onPress={() => handleQuickSchedule(option)}
                >
                  <Text style={styles.quickOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date and time pickers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule for</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{formatDate(scheduledDate)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{formatTime(scheduledDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="repeat" size={20} color={Colors.primary} />
                <Text style={styles.optionLabel}>Repeat daily</Text>
              </View>
              <Switch
                value={repeatDaily}
                onValueChange={setRepeatDaily}
                trackColor={{ false: Colors.ui.disabled, true: Colors.primary }}
                thumbColor={Colors.background.white}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
                <Text style={styles.optionLabel}>Remind me before sending</Text>
              </View>
              <Switch
                value={reminderBefore}
                onValueChange={setReminderBefore}
                trackColor={{ false: Colors.ui.disabled, true: Colors.primary }}
                thumbColor={Colors.background.white}
              />
            </View>
          </View>

          {/* Schedule button */}
          <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
            <LinearGradient colors={Colors.gradient.primary} style={styles.scheduleButtonGradient}>
              <Ionicons name="time" size={20} color={Colors.background.white} />
              <Text style={styles.scheduleButtonText}>Schedule Message</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.text.tertiary} />
            <Text style={styles.previewText}>
              Message will be sent {formatDate(scheduledDate)} at {formatTime(scheduledDate)}
            </Text>
          </View>

          {/* Date picker modal */}
          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Time picker modal */}
          {showTimePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// Scheduled messages list component
export const ScheduledMessagesList = ({ messages = [], onEdit, onDelete, onSendNow }) => {
  if (messages.length === 0) {
    return (
      <View style={styles.emptyList}>
        <Ionicons name="time-outline" size={48} color={Colors.border.light} />
        <Text style={styles.emptyText}>No scheduled messages</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {messages.map((msg, index) => (
        <View key={msg.id || index} style={styles.scheduledItem}>
          <View style={styles.scheduledItemHeader}>
            <View style={styles.scheduledTime}>
              <Ionicons name="time" size={14} color={Colors.primary} />
              <Text style={styles.scheduledTimeText}>
                {new Date(msg.scheduledAt).toLocaleString()}
              </Text>
            </View>
            <View style={styles.scheduledActions}>
              <TouchableOpacity onPress={() => onSendNow?.(msg)}>
                <Ionicons name="send" size={18} color={Colors.accent.teal} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onEdit?.(msg)}>
                <Ionicons name="pencil" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete?.(msg)}>
                <Ionicons name="trash" size={18} color={Colors.accent.red} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.scheduledMessage} numberOfLines={2}>
            {msg.message}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.dark,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: Colors.background.light,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '48%',
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  quickOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickOption: {
    backgroundColor: Colors.status.infoLight,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickOptionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  dateTimeText: {
    fontSize: 14,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  optionsSection: {
    marginBottom: 20,
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    padding: 12,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.text.dark,
  },
  scheduleButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scheduleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  scheduleButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  emptyList: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 12,
  },
  listContainer: {
    gap: 12,
  },
  scheduledItem: {
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  scheduledItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduledTimeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  scheduledActions: {
    flexDirection: 'row',
    gap: 16,
  },
  scheduledMessage: {
    fontSize: 14,
    color: Colors.text.dark,
    lineHeight: 20,
  },
});

export default MessageScheduler;
