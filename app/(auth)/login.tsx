import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { authStore } from '../../utils/auth';
import { authFix } from '../../utils/authFix';
import type { UserRole } from '../../utils/auth';
import { supabase } from '../../utils/supabase';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'renter' as UserRole
  });
  
  // Just check for auth conflicts
  useEffect(() => {
    const resolveConflicts = async () => {
      try {
        const result = await authFix.resolveAuthConflicts();
        console.log('Auth conflict check result:', result);
        
        if (result.hadConflicts) {
          console.log('Resolved authentication conflicts');
        }
      } catch (error) {
        console.error('Error resolving auth conflicts:', error);
      }
    };
    
    resolveConflicts();
  }, []);
  
  const updateField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleLogin = async () => {
    // Basic validation
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Make sure we have a clean session state before login
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        console.log('Found existing session, signing out first...');
        await supabase.auth.signOut();
      }
      
      console.log(`Attempting login with email: ${formData.email}`);
      
      const { data, error, role } = await authStore.signIn(
        formData.email.trim(),
        formData.password.trim()
      );
      
      if (error) {
        console.log(`Login failed: ${error}`);
        
        // Handle common errors with more user-friendly messages
        if (error.includes('Invalid login credentials')) {
          Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
        } else if (error.includes('Email not confirmed') || error.includes('not confirmed') || error.includes('email validation')) {
          Alert.alert('Email Not Verified', 
            'Your account needs to be verified. Please check your email inbox including spam/junk folders for the verification link.',
            [
              {
                text: 'Resend Verification',
                onPress: async () => {
                  setIsLoading(true);
                  console.log(`Attempting to resend verification email to: ${formData.email.trim()}`);
                  const { success, error } = await authStore.resendVerificationEmail(formData.email.trim());
                  setIsLoading(false);
                  
                  if (success) {
                    Alert.alert(
                      'Verification Email Sent',
                      'Please check your inbox (and spam folder) to verify your account. If you still don\'t receive the email, please contact support.'
                    );
                  } else {
                    Alert.alert('Error', 
                      `Failed to resend verification email: ${error || 'Unknown error'}. Please try again later or contact support.`
                    );
                  }
                }
              },
              { text: 'OK' }
            ]
          );
        } else {
          Alert.alert('Login Failed', error);
        }
        
        setIsLoading(false);
        return;
      }
      
      // Make sure we have a role to work with
      const userRole = role || formData.role;
      console.log(`Login successful, user role: ${userRole}`);
      
      // Extra validation to make sure session was created
      const sessionCheck = await supabase.auth.getSession();
      if (!sessionCheck.data.session) {
        console.error('Failed to create a valid session after login, retrying...');
        
        // Try one more time
        await authFix.clearAllAuthData();
        
        const retryResult = await authStore.signIn(
          formData.email.trim(),
          formData.password.trim()
        );
        
        if (retryResult.error || !retryResult.data) {
          Alert.alert('Login Failed', 'Could not establish a valid session. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      // Synchronize the two auth systems
      try {
        await authFix.syncAuthSystems();
        console.log('Auth systems synchronized after login');
      } catch (syncError) {
        console.error('Failed to synchronize auth systems:', syncError);
        // Continue anyway, this is just for better reliability
      }
      
      // Only show role mismatch warning if roles don't match and both exist
      if (role && formData.role !== role) {
        console.log(`Role mismatch: selected ${formData.role}, account has ${role}`);
        Alert.alert(
          'Role Mismatch', 
          `You've selected ${formData.role} role but your account is registered as ${role}. Would you like to continue with your registered role?`,
          [
            {
              text: 'Continue with ' + role,
              onPress: () => {
                // Add a short delay before navigation to prevent issues
                setTimeout(() => {
                  console.log(`Navigating to dashboard with role: ${role}`);
                  router.replace(`/(authenticated)/${role}/(screens)/dashboard`);
                }, 500);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false)
            }
          ]
        );
        return;
      }
      
      // Add a longer delay before navigation to prevent issues
      console.log(`Will navigate to dashboard with role: ${userRole} after delay`);
      setTimeout(() => {
        // Double-check the component is still mounted before navigation
        console.log(`Navigating to dashboard with role: ${userRole}`);
        router.replace(`/(authenticated)/${userRole}/(screens)/dashboard`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Avoid rendering until auth check is complete
  if (isCheckingAuth) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Signing in...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>CodeZ</Text>
        <Text style={styles.subtitle}>Rent Your Electric Vehicle</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <Ionicons name="car-sport" size={120} color="#f4511e" />
      </View>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={formData.password}
          onChangeText={(value) => updateField('password', value)}
          secureTextEntry
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select Role</Text>
          <Picker
            selectedValue={formData.role}
            onValueChange={(itemValue) => updateField('role', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Renter" value="renter" />
            <Picker.Item label="Admin" value="admin" />
          </Picker>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('/(auth)/register')}
          style={styles.linkButton}
          disabled={isLoading}
          activeOpacity={0.6}
        >
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={async () => {
            Alert.alert(
              "Fix Login Issues",
              "This will clear all authentication data and may help resolve login problems. Continue?",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Diagnose Issues",
                  onPress: async () => {
                    setIsLoading(true);
                    try {
                      const diagnosis = await authFix.diagnoseAuthIssues();
                      const conflicts = await authFix.resolveAuthConflicts();
                      
                      if (diagnosis.hasIssues) {
                        Alert.alert(
                          "Authentication Issues Found", 
                          `Issues found: \n- ${diagnosis.issues.join('\n- ')}\n\nWould you like to clear all authentication data to resolve these issues?`,
                          [
                            {
                              text: "Cancel",
                              style: "cancel",
                              onPress: () => setIsLoading(false)
                            },
                            {
                              text: "Clear Data",
                              style: "destructive",
                              onPress: async () => {
                                const result = await authFix.signOutAndClearSession();
                                Alert.alert("Success", "Authentication data cleared. Please try logging in again.");
                                setIsLoading(false);
                              }
                            }
                          ]
                        );
                      } else {
                        Alert.alert("No Issues Found", "Authentication system appears to be working correctly. Try logging in again.");
                        setIsLoading(false);
                      }
                    } catch (error) {
                      Alert.alert("Error", "Could not diagnose authentication issues. Please try again.");
                      setIsLoading(false);
                    }
                  }
                },
                {
                  text: "Clear Auth Data",
                  onPress: async () => {
                    setIsLoading(true);
                    try {
                      const result = await authFix.signOutAndClearSession();
                      Alert.alert("Success", "Authentication data cleared. Please try logging in again.");
                    } catch (error) {
                      Alert.alert("Error", "Could not clear authentication data. Please try again.");
                    } finally {
                      setIsLoading(false);
                    }
                  },
                  style: "destructive"
                }
              ]
            );
          }}
          style={styles.resetButton}
          disabled={isLoading}
        >
          <Text style={styles.resetButtonText}>Having trouble logging in?</Text>
        </TouchableOpacity>
        
        <Text style={styles.privacyText}>
          By signing in, you agree to our Terms and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f4511e',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  form: {
    gap: 15,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#2196F3',
    textAlign: 'center',
    fontSize: 16,
  },
  privacyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  resetButtonText: {
    color: '#f4511e',
    textAlign: 'center',
    fontSize: 14,
  },
}); 
