import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../app/lib/supabase';

// Keys for AsyncStorage
const USER_KEY = 'user_data';
const ACTIVE_USER_EMAIL_KEY = 'active_user_email';

// User data interface
export interface UserData {
  email: string;
  name: string;
  photoUrl?: string;
  lastLogin: Date;
  role?: 'admin' | 'renter';
}

/**
 * Login or register a user with email
 * @param email The user's email address
 * @param name The user's display name
 */
export const loginWithEmail = async (email: string, name: string): Promise<void> => {
  try {
    // Create or update user in Supabase
    const { error } = await supabase
      .from('users')
      .upsert({
        email: email,
        name: name,
        last_login: new Date().toISOString(),
        role: 'renter' // Default role is renter
      }, {
        onConflict: 'email'
      });

    if (error) throw error;

    // Save user data locally
    const userData: UserData = {
      email,
      name,
      lastLogin: new Date(),
      role: 'renter'
    };

    // Save to AsyncStorage
    const userKey = `${USER_KEY}_${email}`;
    await AsyncStorage.setItem(userKey, JSON.stringify(userData));
    
    // Set as active user
    await AsyncStorage.setItem(ACTIVE_USER_EMAIL_KEY, email);
    
    console.log(`User logged in: ${email}`);
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Save user data to AsyncStorage and Supabase
 * @param userData User's data including email
 */
export const saveUserData = async (userData: UserData): Promise<void> => {
  try {
    // Save user data locally
    const userKey = `${USER_KEY}_${userData.email}`;
    await AsyncStorage.setItem(userKey, JSON.stringify(userData));
    
    // Set this as the active user
    await AsyncStorage.setItem(ACTIVE_USER_EMAIL_KEY, userData.email);
    
    // Save to Supabase as well
    const { error } = await supabase
      .from('users')
      .upsert({
        email: userData.email,
        name: userData.name,
        photo_url: userData.photoUrl,
        last_login: userData.lastLogin.toISOString(),
        role: userData.role || 'renter'
      }, {
        onConflict: 'email'
      });

    if (error) console.error('Error saving to Supabase:', error);
    
    console.log(`User data saved for: ${userData.email}`);
  } catch (error: any) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Get current active user's email
 * @returns The email of the active user or null if not logged in
 */
export const getActiveUserEmail = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACTIVE_USER_EMAIL_KEY);
  } catch (error: any) {
    console.error('Error getting active user email:', error);
    return null;
  }
};

/**
 * Get user data for a specific email
 * @param email User's email address
 * @returns User data or null if not found
 */
export const getUserData = async (email: string): Promise<UserData | null> => {
  try {
    // Try to get from Supabase first
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (data && !error) {
      return {
        email: data.email,
        name: data.name,
        photoUrl: data.photo_url,
        lastLogin: new Date(data.last_login),
        role: data.role
      };
    }

    // Fallback to local storage
    const userKey = `${USER_KEY}_${email}`;
    const userData = await AsyncStorage.getItem(userKey);
    
    if (userData) {
      return JSON.parse(userData) as UserData;
    }
    return null;
  } catch (error: any) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Check if a user is currently logged in
 * @returns True if a user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  const activeEmail = await getActiveUserEmail();
  return activeEmail !== null;
};

/**
 * Log out the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACTIVE_USER_EMAIL_KEY);
    console.log('User logged out');
  } catch (error: any) {
    console.error('Error logging out user:', error);
    throw error;
  }
}; 