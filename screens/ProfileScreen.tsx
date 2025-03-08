import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePressAnimation, useFadeIn, useSlideIn } from '../hooks/useAnimations';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Login: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  const saveButtonAnimation = usePressAnimation();
  const backButtonAnimation = usePressAnimation();
  const formSlide = useSlideIn('bottom', 50, 800);
  const headerFade = useFadeIn(800);
  
  useEffect(() => {
    fetchProfile();
  }, [session]);
  
  const fetchProfile = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data?.username) {
        setUsername(data.username);
        setOriginalUsername(data.username);
      } else {
        // Set default username from email if no username is set
        const defaultUsername = session.user.email?.split('@')[0] || '';
        setUsername(defaultUsername);
        setOriginalUsername(defaultUsername);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (username === originalUsername) {
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session?.user?.id,
          username: username.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerFade]}>
          <AnimatedPressable
            style={[styles.backButton, { backgroundColor: colors.card }, backButtonAnimation.style]}
            onPress={() => {
              backButtonAnimation.animatePress();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </AnimatedPressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        </Animated.View>

        <Animated.View style={[styles.formContainer, { backgroundColor: colors.card }, formSlide]}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
            <View style={[
              styles.inputWrapper,
              { 
                borderColor: username.length > 0 ? colors.primary : colors.border,
                backgroundColor: colors.card 
              }
            ]}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={username.length > 0 ? colors.primary : colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <AnimatedPressable
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              saveButtonAnimation.style,
              { opacity: loading ? 0.7 : 1 }
            ]}
            onPress={() => {
              saveButtonAnimation.animatePress();
              handleSave();
            }}
            disabled={loading}
          >
            <Ionicons 
              name="save-outline" 
              size={20} 
              color={isDark ? '#000' : '#fff'}
              style={styles.buttonIcon}
            />
            <Text style={[styles.saveButtonText, { color: isDark ? '#000' : '#fff' }]}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  backButton: {
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
  formContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});