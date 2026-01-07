import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

/**
 * AuthModal component for displaying authentication screens in a modal
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal should be closed
 * @param {string} props.title - Main title text
 * @param {string} props.subtitle - Subtitle text
 * @param {React.Component} props.children - Content to display in the modal
 * @param {Object} props.style - Additional styling for the modal container
 */
const AuthModal = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  style,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={false}
    accessibilityLabel="Authentication dialog"
    onRequestClose={onClose}
  >
    <SafeAreaView style={[styles.container, style]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel="Close authentication modal"
        >
          <Ionicons name="close" size={28} color={Colors.text.dark} />
        </TouchableOpacity>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.gray,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});

export default AuthModal;