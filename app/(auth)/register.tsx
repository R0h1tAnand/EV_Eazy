import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { authStore } from '../../utils/auth';
import { Picker } from '@react-native-picker/picker';
import type { UserRole } from '../../utils/auth';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    aadharNumber: '',
    role: 'renter' as UserRole,
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Basic validation
    if (!formData.email || !formData.password || !formData.confirmPassword || 
        !formData.phoneNumber || !formData.aadharNumber) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.phoneNumber.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    if (formData.aadharNumber.length !== 12) {
      Alert.alert('Error', 'Aadhar number must be 12 digits');
      return;
    }

    setLoading(true);
    try {
      // First check if the email already exists
      const emailStatus = await authStore.checkEmailStatus(formData.email);
      
      // If email exists but is not confirmed, offer to resend verification
      if (emailStatus.exists && !emailStatus.confirmed) {
        setLoading(false);
        Alert.alert(
          'Email Not Verified',
          'This email is already registered but not verified. Would you like to resend the verification email?',
          [
            {
              text: 'Resend Verification',
              onPress: async () => {
                setLoading(true);
                const { success, error } = await authStore.resendVerificationEmail(formData.email);
                setLoading(false);
                if (success) {
                  Alert.alert(
                    'Verification Email Sent',
                    'Please check your inbox (and spam folder) to verify your email before logging in.'
                  );
                } else {
                  Alert.alert('Error', `Failed to resend: ${error || 'Unknown error'}`);
                }
              }
            },
            {
              text: 'Go to Login',
              onPress: () => router.push('/(auth)/login')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      // If email exists and is confirmed, tell the user to log in
      if (emailStatus.exists && emailStatus.confirmed) {
        setLoading(false);
        Alert.alert(
          'Account Exists',
          'This email is already registered and verified. Please log in instead.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.push('/(auth)/login')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      // Continue with registration if email doesn't exist
      const { success, error } = await authStore.registerUser({
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        aadharNumber: formData.aadharNumber,
        role: formData.role,
      });

      if (success) {
        Alert.alert(
          'Registration Successful',
          'A verification email has been sent to your email address. Please check your inbox (including spam/junk folders) and verify your email before logging in.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.push('/(auth)/login'),
            },
          ]
        );
      } else if (error?.includes('already registered')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Please try logging in instead.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.push('/(auth)/login'),
            },
            {
              text: 'Try Again',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', error || 'Failed to create account. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Creating your account...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Register</Text>
      
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

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChangeText={(value) => updateField('phoneNumber', value)}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Aadhar Number"
          value={formData.aadharNumber}
          onChangeText={(value) => updateField('aadharNumber', value)}
          keyboardType="numeric"
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
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(auth)/login')}
          style={styles.linkButton}
          disabled={loading}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 30,
    textAlign: 'center',
    color: '#f4511e',
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
    borderWidth: 1,
    borderColor: '#ddd',
  },
}); 