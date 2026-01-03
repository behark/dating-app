import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const PhoneVerificationScreen = ({ navigation, route }) => {
  const { sendPhoneVerification, verifyPhone, currentUser } = useAuth();
  
  const [step, setStep] = useState(1); // 1: enter phone, 2: verify code
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer for resend button
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatPhoneNumber = (text) => {
    // Basic formatting - can be customized based on country
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 0) {
      formatted = '+' + cleaned;
    }
    return formatted;
  };

  const handleSendCode = async () => {
    try {
      if (!phoneNumber.trim()) {
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }

      setLoading(true);
      await sendPhoneVerification(phoneNumber);

      setStep(2);
      setTimer(60);
      setCanResend(false);
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      if (!verificationCode.trim()) {
        Alert.alert('Error', 'Please enter the verification code');
        return;
      }

      setLoading(true);
      await verifyPhone(verificationCode);

      Alert.alert(
        'Success',
        'Phone number verified!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await sendPhoneVerification(phoneNumber);
      setTimer(60);
      setCanResend(false);
      setVerificationCode('');
      Alert.alert('Success', 'Verification code resent');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your phone number to get started'
              : 'Enter the code sent to your phone'}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                editable={!loading}
              />
              <Text style={styles.helperText}>
                Include country code (e.g., +1 for US)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                editable={!loading}
                maxLength={6}
              />
              <Text style={styles.helperText}>
                Enter the 6-digit code
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={loading}>
                  <Text style={styles.resendButton}>Resend</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Resend in {timer}s
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.changeNumber}>Change phone number</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  header: {
    marginBottom: 30,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center'
  },
  form: {
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  button: {
    paddingVertical: 14,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  skipText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
    padding: 10
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8
  },
  resendText: {
    color: '#666',
    fontSize: 14
  },
  resendButton: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 14
  },
  timerText: {
    color: '#999',
    fontSize: 14
  },
  changeNumber: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 10
  }
});

export default PhoneVerificationScreen;
