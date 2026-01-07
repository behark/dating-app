import { Alert } from 'react-native';

/**
 * Show a confirmation dialog for destructive actions
 * @param {Object} options - Configuration options
 * @param {string} options.title - Alert title
 * @param {string} options.message - Alert message
 * @param {string} options.confirmText - Text for confirm button (default: "Confirm")
 * @param {string} options.cancelText - Text for cancel button (default: "Cancel")
 * @param {string} options.confirmButtonStyle - Style for confirm button (default: "destructive")
 * @param {Function} options.onConfirm - Callback when user confirms
 * @param {Function} options.onCancel - Optional callback when user cancels
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export const showConfirmation = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'destructive',
  onConfirm,
  onCancel,
}) => {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => {
            if (onCancel) onCancel();
            resolve(false);
          },
        },
        {
          text: confirmText,
          style: confirmButtonStyle,
          onPress: () => {
            if (onConfirm) onConfirm();
            resolve(true);
          },
        },
      ],
      { cancelable: true }
    );
  });
};

/**
 * Show confirmation for blocking a user
 * @param {string} userName - Name of user to block
 * @param {Function} onConfirm - Callback when confirmed
 * @returns {Promise<boolean>}
 */
export const confirmBlockUser = (userName, onConfirm) => {
  return showConfirmation({
    title: 'Block User',
    message: `Are you sure you want to block ${userName || 'this user'}? You won't be able to see each other's profiles or send messages. This action can be undone later.`,
    confirmText: 'Block',
    cancelText: 'Cancel',
    confirmButtonStyle: 'destructive',
    onConfirm,
  });
};

/**
 * Show confirmation for unblocking a user
 * @param {string} userName - Name of user to unblock
 * @param {Function} onConfirm - Callback when confirmed
 * @returns {Promise<boolean>}
 */
export const confirmUnblockUser = (userName, onConfirm) => {
  return showConfirmation({
    title: 'Unblock User',
    message: `Are you sure you want to unblock ${userName || 'this user'}? You'll be able to see each other's profiles and send messages again.`,
    confirmText: 'Unblock',
    cancelText: 'Cancel',
    confirmButtonStyle: 'default',
    onConfirm,
  });
};

/**
 * Show confirmation for deleting a message
 * @param {Function} onConfirm - Callback when confirmed
 * @returns {Promise<boolean>}
 */
export const confirmDeleteMessage = (onConfirm) => {
  return showConfirmation({
    title: 'Delete Message',
    message: 'Are you sure you want to delete this message? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmButtonStyle: 'destructive',
    onConfirm,
  });
};

/**
 * Show confirmation for deleting multiple messages
 * @param {number} count - Number of messages to delete
 * @param {Function} onConfirm - Callback when confirmed
 * @returns {Promise<boolean>}
 */
export const confirmDeleteMessages = (count, onConfirm) => {
  return showConfirmation({
    title: 'Delete Messages',
    message: `Are you sure you want to delete ${count} message${count > 1 ? 's' : ''}? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmButtonStyle: 'destructive',
    onConfirm,
  });
};
