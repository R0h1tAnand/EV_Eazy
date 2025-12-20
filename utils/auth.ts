import { supabase } from './supabase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { authFix } from './authFix';

export type UserRole = 'renter' | 'admin';

interface RegisterUserParams {
  email: string;
  password: string;
  phoneNumber: string;
  aadharNumber: string;
  role: UserRole;
}

class AuthStore {
  async registerUser(params: RegisterUserParams) {
    try {
      console.log('Starting user registration process for:', params.email);
      
      // Set email confirmation to true explicitly
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            role: params.role,
            phoneNumber: params.phoneNumber,
            aadharNumber: params.aadharNumber,
          },
          emailRedirectTo: 'codezapp://auth/confirm',  // Add custom redirect URL
        },
      });

      if (error) {
        console.error('Supabase signup error:', error.message);
        return { success: false, error: error.message };
      }
      
      // Check if a confirmation email was triggered
      if (data?.user?.identities?.length === 0) {
        console.error('Email already registered but not confirmed');
        return { 
          success: false, 
          error: 'This email is already registered but not confirmed. Please check your inbox for the verification email or request a new one.'
        };
      }
      
      if (!data?.user?.id) {
        console.error('User created but no ID returned');
        return { success: false, error: 'Account created but user ID not returned. Please try logging in.' };
      }
      
      console.log('User registration successful, confirmation email sent');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error in registerUser:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string) {
    try {
      console.log(`Attempting to sign in with email: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(`Auth error during sign in: ${error.message}`);
        return { data: null, error: error.message, role: null };
      }

      console.log('Sign in successful, checking user metadata');
      
      // For debugging purposes, log the user object
      console.log('User data:', JSON.stringify(data.user));
      
      // Get role from user metadata or default to 'renter'
      const role = data.user?.user_metadata?.role as UserRole || 'renter';
      
      // If role is missing but user exists, update their metadata with default role
      if (data.user && !data.user.user_metadata?.role) {
        console.log('Role not found in user metadata, setting default role: renter');
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { role: 'renter' }
          });
          
          if (updateError) {
            console.error(`Failed to update user role: ${updateError.message}`);
          }
        } catch (updateError: any) {
          console.error(`Exception when updating user role: ${updateError.message}`);
        }
      }

      return { data, error: null, role };
    } catch (error: any) {
      console.error(`Exception during sign in: ${error.message}`);
      return { data: null, error: error.message, role: null };
    }
  }

  async signOut() {
    try {
      // Use our more robust signOutAndClearSession method instead
      const result = await authFix.signOutAndClearSession();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('Error in signOut:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      console.log(`Attempting to resend verification email to: ${email}`);
      
      // First check if a user exists with this email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (userError && !userError.message.includes('No rows found')) {
        console.error('Error checking user before resending verification:', userError);
      }
      
      // If user exists in the users table but might not have auth set up correctly
      if (userData && !userError) {
        console.log('User found in database, attempting to resend verification email');
      }
      
      // Resend the verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'codezapp://auth/confirm', // Match the same redirect as registration
        }
      });

      if (error) {
        console.error('Error resending verification email:', error);
        return { success: false, error: error.message };
      }

      console.log('Verification email resent successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Unexpected error in resendVerificationEmail:', error);
      return { success: false, error: error.message };
    }
  }

  async validateUser() {
    try {
      console.log('Validating user session');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error(`Auth error during validation: ${error.message}`);
        throw error;
      }
      
      if (!user) {
        console.log('No user found during validation');
        return { isValid: false, role: null };
      }
      
      // Log user details for debugging
      console.log(`User found: ${user.email}`);
      console.log('User metadata:', JSON.stringify(user.user_metadata));
      
      // Get role from metadata or default to 'renter'
      const role = user.user_metadata?.role as UserRole || 'renter';
      
      // If role is missing, set a default and update
      if (!user.user_metadata?.role) {
        console.log('Role not found in user metadata, setting default role: renter');
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { role: 'renter' }
          });
          
          if (updateError) {
            console.error(`Failed to update user role: ${updateError.message}`);
          }
        } catch (updateError: any) {
          console.error(`Exception when updating user role: ${updateError.message}`);
        }
      }

      return { isValid: true, role };
    } catch (error: any) {
      console.error(`Exception during user validation: ${error.message}`);
      return { isValid: false, role: null };
    }
  }

  async checkEmailStatus(email: string) {
    try {
      console.log(`Checking status for email: ${email}`);
      
      // Try to sign in with an invalid password to check if the user exists
      // This is a workaround since Supabase doesn't provide a direct API to check email existence
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'INVALID_PASSWORD_CHECK_ONLY'
      });
      
      if (error) {
        // If the error is about invalid credentials, the email exists but needs correct password
        if (error.message.includes('Invalid login credentials')) {
          console.log(`Email ${email} exists in the auth system`);
          return { exists: true, confirmed: true, error: null };
        }
        
        // If the error mentions email not confirmed, the account exists but is not verified
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('not confirmed') || 
            error.message.includes('email validation')) {
          console.log(`Email ${email} exists but is not confirmed`);
          return { exists: true, confirmed: false, error: null };
        }
        
        // Any other error is unexpected
        console.error('Unexpected error checking email status:', error);
        return { exists: false, confirmed: false, error: error.message };
      }
      
      // If no error, then somehow the login succeeded (shouldn't happen with invalid password)
      console.warn(`Unexpected success with invalid password for ${email}`);
      return { exists: true, confirmed: true, error: null };
    } catch (error: any) {
      console.error('Error in checkEmailStatus:', error);
      return { exists: false, confirmed: false, error: error.message };
    }
  }
}

export const authStore = new AuthStore(); 