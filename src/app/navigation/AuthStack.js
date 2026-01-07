import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Feature-based imports
import HomeScreen from '../../features/discovery/screens/DiscoveryScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';

const ForgotPasswordScreen = require('../../features/auth/screens/ForgotPasswordScreen').default;
const RegisterScreen = require('../../features/auth/screens/RegisterScreen').default;
const EmailVerificationScreen = require('../../features/auth/screens/EmailVerificationScreen').default;

// Legacy screens
const TermsOfServiceScreen = require('../../screens/TermsOfServiceScreen').default;
const PrivacyPolicyScreen = require('../../screens/PrivacyPolicyScreen').default;

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Guest mode: Show HomeScreen with limited access instead of PreviewHomeScreen */}
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        headerShown: false,
      }}
    />
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{
        presentation: 'modal',
      }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{
        headerShown: false,
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{
        headerShown: false,
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="VerifyEmail"
      component={EmailVerificationScreen}
      options={{
        headerShown: false,
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="TermsOfService"
      component={TermsOfServiceScreen}
      options={{
        headerShown: false,
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="PrivacyPolicy"
      component={PrivacyPolicyScreen}
      options={{
        headerShown: false,
        presentation: 'card',
      }}
    />
  </Stack.Navigator>
);

export default AuthStack;