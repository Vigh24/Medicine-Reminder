import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  showWelcome: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  dismissWelcome: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const dismissWelcome = () => setShowWelcome(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
        // Show welcome message for new sign-ins
        if (session?.user?.user_metadata?.email_verified) {
          setShowWelcome(true);
          Alert.alert(
            '🎉 Welcome to MedReminder!',
            'Your email has been verified successfully. You can now start using the app.',
            [{ text: 'Get Started', onPress: dismissWelcome }]
          );
        }
      }
      setSession(session);
    });

    // Handle deep linking
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Received URL:', event.url);
      
      try {
        if (event.url.startsWith('medreminder://')) {
          // Extract any auth parameters if they exist
          const url = new URL(event.url);
          const params = new URLSearchParams(url.search);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Setting session from deep link');
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error('Error setting session:', error);
              throw error;
            }
            
            if (session) {
              console.log('Session set successfully');
              setSession(session);
              // Show welcome message for successful verification
              setShowWelcome(true);
              Alert.alert(
                '🎉 Welcome to MedReminder!',
                'Your email has been verified successfully. You can now start using the app.',
                [{ text: 'Get Started', onPress: dismissWelcome }]
              );
            }
          }
        }
      } catch (err) {
        console.error('Deep link handling error:', err);
        Alert.alert(
          'Verification Error',
          'There was an error verifying your email. Please try signing in again.',
          [{ text: 'OK' }]
        );
      }
    };

    // Set up deep link listeners
    Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      // Create profile if it doesn't exist
      if (data.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select()
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: data.user.email?.split('@')[0] || '',
              updated_at: new Date().toISOString(),
            });

          if (createError) {
            console.error('Error creating profile:', createError);
          }
        }
      }

      console.log('Successfully signed in');
    } catch (err) {
      console.error('Sign in process error:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Starting signup process for:', email);
      
      // Use a more reliable deep link format
      const redirectTo = `${Linking.createURL('auth/callback')}`;
      console.log('Redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            app_name: 'MedReminder'
          }
        }
      });
      
      console.log('Signup API response:', {
        user: data?.user,
        session: data?.session,
        identities: data?.user?.identities,
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      // Check if email confirmation was sent
      if (!data?.user?.identities || data.user.identities.length === 0) {
        console.error('No identities found - email might be registered');
        throw new Error('This email is already registered. Please sign in or use a different email.');
      }

      if (!data.user?.email) {
        console.error('No email in response');
        throw new Error('Failed to create account. Please try again.');
      }

      // Create initial profile
      if (data.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: data.user.email.split('@')[0],
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      console.log('Signup successful, confirmation email should be sent to:', data.user.email);
      
      // Show instructions alert
      Alert.alert(
        'Check Your Email',
        `We've sent a confirmation email to ${data.user.email}. Please check your inbox and click the verification link to complete your registration.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Signup process error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      console.log('Successfully signed out');
    } catch (err) {
      console.error('Sign out process error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      showWelcome,
      signIn, 
      signUp, 
      signOut,
      dismissWelcome 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};