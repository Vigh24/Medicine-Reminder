import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFadeIn, useSlideIn, usePressAnimation } from '../hooks/useAnimations';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ActionType = 'Schedule' | 'Reports' | 'Reminders';

const ACTION_PROPS: Record<ActionType, {
  name: string;
  color: string;
  bg: string;
}> = {
  Schedule: {
    name: 'calendar-outline',
    color: '#2196f3',
    bg: '#E3F2FD'
  },
  Reports: {
    name: 'stats-chart-outline',
    color: '#4CAF50',
    bg: '#E8F5E9'
  },
  Reminders: {
    name: 'notifications-outline',
    color: '#FF9800',
    bg: '#FFF3E0'
  }
};

type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Login: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { session, signOut } = useAuth();
  const { colors, isDark, toggleTheme, themeAnimation } = useTheme();
  const [username, setUsername] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  useEffect(() => {
    fetchProfile();
  }, []);

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
      } else {
        // Set default username from email if no username is set
        setUsername(session.user.email?.split('@')[0] || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfilePress = () => {
    profileButtonAnimation.animatePress();
    setShowProfileMenu(true);
  };

  const handleEditProfile = () => {
    setShowProfileMenu(false);
    navigation.navigate('Profile');
  };

  const handleSignOut = () => {
    setShowProfileMenu(false);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Animations
  const headerOpacity = useFadeIn(800);
  const statsSlide = useSlideIn('bottom', 50, 800, 200);
  const cardSlide = useSlideIn('bottom', 50, 800, 400);
  const actionsSlide = useSlideIn('bottom', 50, 800, 600);

  const themeButtonAnimation = usePressAnimation();
  const profileButtonAnimation = usePressAnimation();
  const addButtonAnimation = usePressAnimation();

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />
      
      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={[
            styles.menuContainer,
            { 
              backgroundColor: colors.card,
              top: Platform.OS === 'ios' ? 100 : 80,
              right: 16
            }
          ]}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: colors.background }
              ]}
              onPress={handleEditProfile}
            >
              <Ionicons name="person-outline" size={20} color={colors.text} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Edit Profile</Text>
            </Pressable>
            
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: colors.background }
              ]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.error }]}>Sign Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, {username}! 👋
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <AnimatedPressable
              style={[
                styles.iconButton,
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
                <Ionicons name="sunny-outline" size={20} color={colors.text} />
              </Animated.View>
              <Animated.View
                style={{
                  opacity: themeAnimation.interpolate([0, 1]),
                  position: 'absolute'
                }}
              >
                <Ionicons name="moon-outline" size={20} color={colors.text} />
              </Animated.View>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                styles.profileButton,
                { backgroundColor: colors.primary },
                profileButtonAnimation.style
              ]}
              onPress={handleProfilePress}
            >
              <Text style={styles.profileLetter}>
                {username?.[0]?.toUpperCase() || 'U'}
              </Text>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View style={[styles.statsContainer, statsSlide]}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taken Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="time" size={24} color="#FF9800" />
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Meds</Text>
          </View>
        </Animated.View>

        {/* Welcome Card */}
        <Animated.View style={[styles.card, { backgroundColor: colors.card }, cardSlide]}>
          <View style={styles.cardHeader}>
            <Ionicons name="medical" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome to MedReminder</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            Your medication tracking app is ready to use. Start by adding your medications to get reminders.
          </Text>
          <AnimatedPressable
            style={[
              styles.addButton,
              { backgroundColor: colors.primary },
              addButtonAnimation.style
            ]}
            onPress={() => {
              addButtonAnimation.animatePress();
              Alert.alert('Coming Soon', 'This feature will be available soon!');
            }}
          >
            <Ionicons name="add" size={20} color={isDark ? '#000' : '#fff'} style={styles.buttonIcon} />
            <Text style={[styles.addButtonText, { color: isDark ? '#000' : '#fff' }]}>Add Medication</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActions, actionsSlide]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            {(['Schedule', 'Reports', 'Reminders'] as ActionType[]).map((action) => {
              const buttonAnimation = usePressAnimation();
              const iconProps = {
                ...ACTION_PROPS[action],
                bg: isDark 
                  ? action === 'Schedule' 
                    ? '#1a237e' 
                    : action === 'Reports'
                      ? '#1b5e20'
                      : '#e65100'
                  : ACTION_PROPS[action].bg
              };

              return (
                <AnimatedPressable
                  key={action}
                  style={[styles.actionButton, buttonAnimation.style]}
                  onPress={() => {
                    buttonAnimation.animatePress();
                    Alert.alert('Coming Soon', 'This feature will be available soon!');
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: iconProps.bg }]}>
                    <Ionicons
                      name={iconProps.name as any}
                      size={24}
                      color={action === 'Schedule' ? colors.primary : iconProps.color}
                    />
                  </View>
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                    {action}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  profileLetter: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 14,
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
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 48) / 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    width: 200,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    width: '100%',
  },
});