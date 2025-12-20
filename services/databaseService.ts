import AsyncStorage from '@react-native-async-storage/async-storage';

// User balance key prefix in AsyncStorage
const USER_BALANCE_KEY_PREFIX = 'user_balance_';

/**
 * Convert email to a valid storage key by encoding special characters
 * @param email User's email address
 * @returns Encoded string safe for use as a storage key
 */
const emailToKey = (email: string): string => {
  return encodeURIComponent(email.toLowerCase());
};

/**
 * Get the current balance for a user from the database.
 * In a real app, this would make an API call to your backend.
 * For this demo, we're using AsyncStorage as a simple local database.
 * 
 * @param email The user's email address (Gmail)
 * @returns Promise resolving to the user's current balance
 */
export const getUserBalance = async (email: string): Promise<number> => {
  try {
    const encodedEmail = emailToKey(email);
    const balanceKey = `${USER_BALANCE_KEY_PREFIX}${encodedEmail}`;
    const storedBalance = await AsyncStorage.getItem(balanceKey);
    
    if (storedBalance !== null) {
      return parseFloat(storedBalance);
    }
    
    // Default balance if not found
    const defaultBalance = 150;
    await AsyncStorage.setItem(balanceKey, defaultBalance.toString());
    return defaultBalance;
  } catch (error: any) {
    console.error('Error getting user balance:', error);
    throw error;
  }
};

/**
 * Update the balance for a user in the database.
 * In a real app, this would make an API call to your backend.
 * 
 * @param email The user's email address (Gmail)
 * @param newBalance The new balance to set
 * @returns Promise that resolves when the update is complete
 */
export const updateUserBalance = async (email: string, newBalance: number): Promise<void> => {
  try {
    const encodedEmail = emailToKey(email);
    const balanceKey = `${USER_BALANCE_KEY_PREFIX}${encodedEmail}`;
    await AsyncStorage.setItem(balanceKey, newBalance.toString());
    console.log(`User ${email} balance updated to ${newBalance}`);
  } catch (error: any) {
    console.error('Error updating user balance:', error);
    throw error;
  }
};

/**
 * Add to the user's balance (e.g., top-up)
 * 
 * @param email The user's email address (Gmail)
 * @param amount The amount to add to the balance
 * @returns Promise resolving to the new balance
 */
export const addUserBalance = async (email: string, amount: number): Promise<number> => {
  try {
    const currentBalance = await getUserBalance(email);
    const newBalance = currentBalance + amount;
    await updateUserBalance(email, newBalance);
    return newBalance;
  } catch (error: any) {
    console.error('Error adding to user balance:', error);
    throw error;
  }
};

/**
 * Deduct from the user's balance (e.g., rental payment)
 * 
 * @param email The user's email address (Gmail)
 * @param amount The amount to deduct from the balance
 * @returns Promise resolving to the new balance
 */
export const deductUserBalance = async (email: string, amount: number): Promise<number> => {
  try {
    const currentBalance = await getUserBalance(email);
    const newBalance = Math.max(0, currentBalance - amount); // Ensure balance doesn't go below 0
    await updateUserBalance(email, newBalance);
    return newBalance;
  } catch (error: any) {
    console.error('Error deducting from user balance:', error);
    throw error;
  }
}; 