import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { LocationService } from '../services/LocationService';
import { validateEmail } from '../utils/validators';
import { showStandardError, STANDARD_ERROR_MESSAGES } from '../utils/errorHandler';
import { useThrottle } from '../hooks/useDebounce';
import { sanitizeEmail, sanitizeString } from '../utils/sanitize';
import logger from '../utils/logger';

export const RegisterScreen = ({ navigation }) => {
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Request location permission and get current location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        setLocationLoading(true);
        setLocationError(null);
        const currentLocation = await LocationService.getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
        } else {
          setLocationError('Location permission denied or unavailable');
        }
      } catch (error) {
        logger.error('Error getting location during registration:', error);
        setLocationError('Failed to get location. Please enable location services.');
      } finally {
        setLocationLoading(false);
      }
    };

    getLocation();
  }, []);

  // Throttle registration to prevent rapid submissions
  const { execute: executeRegister, isPending: isRegisterPending } = useThrottle(async () => {
    if (loading || isRegisterPending) return;

    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizeString(password, { escapeHtml: false }); // Don't escape password
      const sanitizedConfirmPassword = sanitizeString(confirmPassword, { escapeHtml: false });
      const sanitizedName = sanitizeString(name);

      // Validation
      if (!sanitizedEmail) {
        showStandardError('Email is required', 'validation');
        return;
      }

      if (!validateEmail(sanitizedEmail)) {
        showStandardError('Please enter a valid email address', 'validation');
        return;
      }

      if (!sanitizedPassword) {
        showStandardError('Password is required', 'validation');
        return;
      }

      if (sanitizedPassword.length < 8) {
        showStandardError('Password must be at least 8 characters long', 'validation');
        return;
      }

      if (sanitizedPassword !== sanitizedConfirmPassword) {
        showStandardError('Passwords do not match. Please try again.', 'validation');
        return;
      }

      if (!sanitizedName) {
        showStandardError('Name is required', 'validation');
        return;
      }

      // CRITICAL FIX: Location is now optional - allow signup without location
      // Backend will use default location if not provided
      if (!location) {
        Alert.alert(
          'Location Not Available',
          "We couldn't access your location. You can still sign up, but we recommend enabling location services later to find matches nearby. Would you like to continue?",
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue Without Location',
              onPress: async () => {
                // Continue with signup - location will be null, backend will use default
                try {
                  setLoading(true);
                  await signup(
                    sanitizedEmail,
                    sanitizedPassword,
                    sanitizedName,
                    parseInt(age),
                    gender,
                    null
                  );
                } catch (error) {
                  logger.error('Signup error:', error);
                  showStandardError(error, 'signup', 'Sign Up Failed');
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              text: 'Retry Location',
              onPress: async () => {
                try {
                  setLocationLoading(true);
                  setLocationError(null);
                  const currentLocation = await LocationService.getCurrentLocation();
                  if (currentLocation) {
                    setLocation(currentLocation);
                  }
                } catch (error) {
                  logger.error('Error retrying location:', error);
                  setLocationError('Failed to get location. Please enable location services.');
                } finally {
                  setLocationLoading(false);
                }
              },
            },
          ]
        );
        return;
      }

      setLoading(true);

      // Format location as required by backend: { type: 'Point', coordinates: [longitude, latitude] }
      const locationData = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };

      const result = await signup(
        sanitizedEmail,
        sanitizedPassword,
        sanitizedName,
        age ? parseInt(age) : null,
        gender,
        locationData
      );

      if (result) {
        Alert.alert('Success', 'Account created! Please verify your email address.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('VerifyEmail'),
          },
        ]);
      }
    } catch (error) {
      showStandardError(error, 'signup', 'Registration Failed');
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Find your perfect match</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          {/* Age and Gender Row */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.flexInput]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputGroup, styles.flexInput]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderPicker}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      gender === g.toLowerCase() && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(g.toLowerCase())}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        gender === g.toLowerCase() && styles.genderOptionTextActive,
                      ]}
                    >
                      {g[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordField}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.passwordToggle}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Minimum 8 characters</Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordField}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.passwordToggle}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Status */}
          {locationLoading && (
            <View style={styles.locationStatus}>
              <ActivityIndicator size="small" color={Colors.accent.red} />
              <Text style={styles.locationStatusText}>Getting your location...</Text>
            </View>
          )}
          {locationError && !locationLoading && (
            <View style={styles.locationError}>
              <Text style={styles.locationErrorText}>⚠️ {locationError}</Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    setLocationLoading(true);
                    setLocationError(null);
                    const currentLocation = await LocationService.getCurrentLocation();
                    if (currentLocation) {
                      setLocation(currentLocation);
                    } else {
                      setLocationError('Location permission denied or unavailable');
                    }
                  } catch (error) {
                    logger.error('Error retrying location:', error);
                    setLocationError('Failed to get location. Please enable location services.');
                  } finally {
                    setLocationLoading(false);
                  }
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {location && !locationLoading && (
            <View style={styles.locationSuccess}>
              <Text style={styles.locationSuccessText}>✓ Location ready</Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerBtn,
              (loading || locationLoading || !location) && styles.registerBtnDisabled,
            ]}
            onPress={executeRegister}
            disabled={loading || locationLoading || !location}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.loginLinkButton}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Links */}
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
              <Text style={styles.legalLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalLinkSeparator}> • </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text.dark,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.dark,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  genderPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  genderOptionActive: {
    backgroundColor: Colors.accent.red,
    borderColor: Colors.accent.red,
  },
  genderOptionText: {
    fontWeight: '600',
    color: Colors.text.dark,
  },
  genderOptionTextActive: {
    color: 'white',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingRight: 12,
  },
  passwordField: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: Colors.text.dark,
  },
  passwordToggle: {
    fontSize: 18,
    padding: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  registerBtn: {
    paddingVertical: 14,
    backgroundColor: Colors.accent.red,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  loginLinkButton: {
    color: Colors.accent.red,
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  locationStatusText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  locationError: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  locationErrorText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.accent.red,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  locationSuccess: {
    backgroundColor: '#D4EDDA',
    borderWidth: 1,
    borderColor: '#28A745',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  locationSuccessText: {
    fontSize: 13,
    color: '#155724',
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  legalLinkText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  legalLinkSeparator: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginHorizontal: 8,
  },
});
