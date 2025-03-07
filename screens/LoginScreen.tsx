import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFadeIn, useSlideIn, usePressAnimation, useScale } from '../hooks/useAnimations';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const { signIn, signUp, loading } = useAuth();
  const { colors, isDark, toggleTheme, themeAnimation } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Animations
  const logoScale = useScale(0.5, 1, 800);
  const titleSlide = useSlideIn('bottom', 50, 800, 200);
  const formSlide = useSlideIn('bottom', 50, 800, 400);
  const themeButtonAnimation = usePressAnimation();
  const submitButtonAnimation = usePressAnimation();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccessMessage('');

      // Validate email
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate password
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setSuccessMessage(`We've sent a confirmation email to ${email}. Please check your inbox (and spam folder) to verify your email address before signing in.`);
        // Clear form after successful signup
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <AnimatedPressable
              style={[
                styles.themeToggle,
                { backgroundColor: colors.card },
                themeButtonAnimation.style,
                {
                  transform: [
                    { rotate: themeAnimation.rotate },
                    { scale: themeAnimation.scale }
                  ]
                }
              ]}
              onPress={() => {
                themeButtonAnimation.animatePress();
                toggleTheme();
              }}
            >
              <Animated.View
                style={{
                  opacity: themeAnimation.interpolate([1, 0]),
                  position: 'absolute'
                }}
              >
                <Ionicons name="sunny-outline" size={24} color={colors.text} />
              </Animated.View>
              <Animated.View
                style={{
                  opacity: themeAnimation.interpolate([0, 1]),
                  position: 'absolute'
                }}
              >
                <Ionicons name="moon-outline" size={24} color={colors.text} />
              </Animated.View>
            </AnimatedPressable>
            <Animated.View style={[styles.logoWrapper, { backgroundColor: colors.card }, logoScale]}>
              <Image
                source={{ 
                  uri: 'https://api.a0.dev/assets/image?text=medication%20reminder%20app%20icon%20with%20pill%20and%20clock%20symbols&aspect=1:1'
                }}
                style={styles.logo}
              />
            </Animated.View>
            <Animated.View style={titleSlide}>
              <Text style={[styles.title, { color: colors.text }]}>MedReminder</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Never miss a dose again</Text>
            </Animated.View>
          </View>

          <Animated.View 
            style={[
              styles.formContainer,
              { backgroundColor: colors.card },
              formSlide
            ]}
          >
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>

            {error ? (
              <Animated.View 
                style={[
                  styles.errorContainer,
                  { backgroundColor: isDark ? '#b71c1c20' : '#ffebee' },
                  { opacity: useFadeIn(300) }
                ]}
              >
                <Ionicons name="alert-circle" size={20} color="#d32f2f" style={styles.messageIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {successMessage ? (
              <Animated.View 
                style={[
                  styles.successContainer,
                  { backgroundColor: isDark ? '#1b5e2020' : '#e8f5e9' },
                  { opacity: useFadeIn(300) }
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#2e7d32" style={styles.messageIcon} />
                <Text style={styles.successText}>{successMessage}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  borderColor: email.length > 0 ? colors.primary : colors.border,
                  backgroundColor: colors.card 
                }
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={email.length > 0 ? colors.primary : colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
              <View style={[
                styles.inputWrapper, 
                { 
                  borderColor: password.length > 0 ? colors.primary : colors.border,
                  backgroundColor: colors.card 
                }
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={password.length > 0 ? colors.primary : colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <AnimatedPressable
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.7 : 1
                },
                submitButtonAnimation.style
              ]}
              onPress={() => {
                submitButtonAnimation.animatePress();
                handleSubmit();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              ) : (
                <>
                  <Ionicons 
                    name={isLogin ? "log-in-outline" : "person-add-outline"} 
                    size={20} 
                    color={isDark ? '#000' : '#fff'}
                    style={styles.submitButtonIcon} 
                  />
                  <Text style={[styles.submitButtonText, { color: isDark ? '#000' : '#fff' }]}>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Text>
                </>
              )}
            </AnimatedPressable>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMessage('');
              }}
            >
              <Text style={[styles.toggleButtonText, { color: colors.textSecondary }]}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={[styles.toggleButtonTextHighlight, { color: colors.primary }]}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    flex: 1,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputWrapperActive: {
    borderColor: '#2196f3',
    shadowColor: '#2196f3',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#333',
    fontSize: 16,
  },
  passwordToggle: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#2196f3',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    flexDirection: 'row',
    shadowColor: '#2196f3',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#90caf9',
    shadowOpacity: 0.1,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#666',
    fontSize: 14,
  },
  toggleButtonTextHighlight: {
    color: '#2196f3',
    fontWeight: '600',
  },
  themeToggle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});