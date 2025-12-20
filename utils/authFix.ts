import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Utility class to help fix common authentication issues
 */
class AuthFix {
  /**
   * Clear all authentication data and session information
   * Use this when experiencing login loops or auth related issues
   */
  async clearAllAuthData() {
    try {
      console.log('Clearing all authentication data...');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all AsyncStorage keys related to authentication
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => 
        key.includes('user_data') || 
        key.includes('active_user_email') || 
        key.includes('supabase.auth') ||
        key.includes('sb-')
      );
      
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        console.log(`Removed ${authKeys.length} authentication-related keys from storage`);
      } else {
        console.log('No authentication keys found in storage');
      }
      
      return { success: true, message: 'Successfully cleared all authentication data' };
    } catch (error: any) {
      console.error('Error clearing auth data:', error);
      return { success: false, message: error.message || 'Failed to clear authentication data' };
    }
  }

  /**
   * Fix issues with user metadata by ensuring the role is properly set
   * @param email User's email address
   * @param role Role to set ('renter' or 'admin')
   */
  async fixUserRole(email: string, role: 'renter' | 'admin') {
    try {
      console.log(`Fixing user role for ${email} to ${role}...`);
      
      // Check if user exists first
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        return { success: false, message: 'Not authenticated. Please log in first.' };
      }
      
      if (!user || user.email !== email) {
        return { success: false, message: 'You can only update your own user role' };
      }
      
      // Update the user metadata with the correct role
      const { error } = await supabase.auth.updateUser({
        data: { role }
      });
      
      if (error) {
        return { success: false, message: error.message };
      }
      
      // Update local storage to match
      const userKey = `user_data_${email}`;
      const userData = await AsyncStorage.getItem(userKey);
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        parsedData.role = role;
        await AsyncStorage.setItem(userKey, JSON.stringify(parsedData));
      }
      
      return { success: true, message: `User role updated to ${role}` };
    } catch (error: any) {
      console.error('Error fixing user role:', error);
      return { success: false, message: error.message || 'Failed to fix user role' };
    }
  }
  
  /**
   * Check if there are any authentication issues and provide diagnostics
   */
  async diagnoseAuthIssues() {
    try {
      console.log('Diagnosing authentication issues...');
      
      const issues = [];
      let hasSession = false;
      let userEmail = null;
      
      // Check Supabase session
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        issues.push(`Session error: ${sessionError.message}`);
      }
      
      if (!data.session) {
        issues.push('No active Supabase session');
      } else {
        hasSession = true;
        // Get user email from the session user
        const { data: userData } = await supabase.auth.getUser();
        if (userData && userData.user) {
          userEmail = userData.user.email;
        } else {
          issues.push('Session exists but could not get user data');
        }
      }
      
      // Check AsyncStorage for user data
      const activeUserEmail = await AsyncStorage.getItem('active_user_email');
      
      if (!activeUserEmail) {
        issues.push('No active user email in AsyncStorage');
      } else if (hasSession && userEmail && activeUserEmail !== userEmail) {
        issues.push(`Email mismatch: AsyncStorage has ${activeUserEmail} but session has ${userEmail}`);
      }
      
      if (activeUserEmail) {
        const userKey = `user_data_${activeUserEmail}`;
        const userDataStr = await AsyncStorage.getItem(userKey);
        
        if (!userDataStr) {
          issues.push(`No user data found for email ${activeUserEmail}`);
        } else {
          // Check if role is set
          try {
            const parsedData = JSON.parse(userDataStr);
            if (!parsedData.role) {
              issues.push('User data is missing role information');
            }
          } catch (error) {
            const parseError = error instanceof Error ? error : new Error('Unknown parse error');
            issues.push(`Could not parse user data: ${parseError.message}`);
          }
        }
      }
      
      return { 
        success: true, 
        hasIssues: issues.length > 0,
        issues,
        hasSession,
        activeUserEmail,
        sessionEmail: userEmail
      };
    } catch (error: any) {
      console.error('Error diagnosing auth issues:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to diagnose authentication issues',
        hasIssues: true,
        issues: [error.message || 'Unknown error']
      };
    }
  }

  /**
   * Check for conflicting auth sessions and resolve them
   * This can help when multiple Supabase clients have been initialized
   */
  async resolveAuthConflicts() {
    try {
      console.log('Checking for auth conflicts...');
      
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Look for multiple Supabase session keys
      const sessionKeys = allKeys.filter(key => 
        key.includes('supabase.auth.token') || 
        key.includes('sb-')
      );
      
      if (sessionKeys.length > 1) {
        console.log(`Found ${sessionKeys.length} session keys, this may cause conflicts`);
        
        // Clear all sessions and start fresh
        await this.clearAllAuthData();
        
        return { 
          success: true, 
          hadConflicts: true, 
          message: 'Resolved conflicts by clearing all sessions' 
        };
      }
      
      return { 
        success: true, 
        hadConflicts: false, 
        message: 'No auth conflicts found' 
      };
    } catch (error: any) {
      console.error('Error resolving auth conflicts:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to resolve auth conflicts' 
      };
    }
  }

  /**
   * Synchronize the authService and Supabase auth systems
   * This helps when two different authentication mechanisms are being used
   */
  async syncAuthSystems() {
    try {
      console.log('Synchronizing authentication systems...');
      
      // First check if we have a Supabase session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting Supabase session:', error);
        return { success: false, message: error.message };
      }
      
      if (!data.session) {
        console.log('No active Supabase session, cannot synchronize');
        return { success: false, message: 'No active Supabase session' };
      }
      
      // Get the user data separately to avoid type issues
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.log('Failed to get user data');
        return { success: false, message: 'Failed to get user data' };
      }
      
      const user = userData.user;
      
      // We have a Supabase session, check if we have a corresponding user in authService
      const email = user.email;
      if (!email) {
        console.log('User has no email, cannot synchronize');
        return { success: false, message: 'User has no email' };
      }
      
      // Get active user from authService
      const activeUserEmail = await AsyncStorage.getItem('active_user_email');
      
      // If emails match, we're already in sync
      if (activeUserEmail === email) {
        console.log('Auth systems already in sync');
        
        // Make sure the role matches in both systems
        const userKey = `user_data_${email}`;
        const userDataStr = await AsyncStorage.getItem(userKey);
        
        if (userDataStr) {
          const parsedData = JSON.parse(userDataStr);
          const authServiceRole = parsedData.role;
          const supabaseRole = user.user_metadata?.role;
          
          if (authServiceRole !== supabaseRole && supabaseRole) {
            console.log(`Role mismatch: authService=${authServiceRole}, Supabase=${supabaseRole}. Updating...`);
            
            // Update the authService role to match Supabase
            parsedData.role = supabaseRole;
            await AsyncStorage.setItem(userKey, JSON.stringify(parsedData));
          }
        }
        
        return { success: true, message: 'Auth systems already synchronized' };
      }
      
      // Emails don't match, update authService with Supabase user data
      console.log(`Syncing authService with Supabase user: ${email}`);
      
      // Create user data for authService
      const name = user.user_metadata?.name || email.split('@')[0];
      const role = user.user_metadata?.role || 'renter';
      
      // Save to AsyncStorage
      const userKey = `user_data_${email}`;
      const localUserData = {
        email,
        name,
        lastLogin: new Date(),
        role
      };
      
      await AsyncStorage.setItem(userKey, JSON.stringify(localUserData));
      await AsyncStorage.setItem('active_user_email', email);
      
      console.log('Successfully synchronized auth systems');
      return { success: true, message: 'Successfully synchronized auth systems' };
      
    } catch (error: any) {
      console.error('Error synchronizing auth systems:', error);
      return { success: false, message: error.message || 'Failed to synchronize auth systems' };
    }
  }

  /**
   * Sign out and clear session data in a more reliable way
   * This is useful when experiencing auth session issues
   */
  async signOutAndClearSession() {
    try {
      console.log('Performing thorough sign out and session cleanup...');
      
      // First check if there's a session
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Sign out with specific options to invalidate all sessions
        await supabase.auth.signOut({ 
          scope: 'global' // This invalidates all refresh tokens
        });
        console.log('Successfully signed out from Supabase');
      } else {
        console.log('No active session to sign out from');
      }
      
      // Remove any session storage items
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => 
        key.includes('supabase.auth') || 
        key.includes('sb-') || 
        key.startsWith('user_data_') ||
        key === 'active_user_email'
      );
      
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        console.log(`Removed ${authKeys.length} auth-related keys from storage`);
      }
      
      // Wait briefly to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify that session is really gone
      const verifyCheck = await supabase.auth.getSession();
      if (verifyCheck.data.session) {
        console.warn('Session still exists after sign out attempt!');
        // Force one more try with a different approach
        await supabase.auth.signOut();
      }
      
      return { success: true, message: 'Successfully signed out and cleared session data' };
    } catch (error: any) {
      console.error('Error during sign out:', error);
      return { success: false, message: error.message || 'Failed to sign out' };
    }
  }
}

export const authFix = new AuthFix(); 