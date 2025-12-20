import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../constants/Colors';
import { getUserBalance, updateUserBalance } from '../../../../services/databaseService';
import { getActiveUserEmail, isLoggedIn, getUserData, UserData, loginWithEmail } from '../../../../services/authService';
import { authStore } from '../../../../utils/auth';
import { authFix } from '../../../../utils/authFix';
import { supabase } from '../../../../utils/supabase';
import { Vehicle, getAllVehicles, initializeVehiclesData } from '../../../../services/vehicleService';

// Import the images from assets - using absolute require paths to ensure they load correctly
const o3Image = require('../../../../assets/images/o3.jpg');
const gt5Image = require('../../../../assets/images/gt5.jpg');

// Log the images to console for debugging
console.log('O3 Image:', o3Image);
console.log('GT5 Image:', gt5Image);

// Initial payment history - will be updated after top up
const initialPaymentHistory = {
  currentBalance: 150,
  penalties: [
    {
      type: 'Damage',
      amount: 50,
      date: '2024-03-20',
      status: 'Pending',
    },
    {
      type: 'Overtime',
      amount: 25,
      date: '2024-03-19',
      status: 'Paid',
    },
    {
      type: 'Unauthorized Parking',
      amount: 35,
      date: '2024-03-18',
      status: 'Under Review',
    },
  ],
};

// Helper function to get image based on model
const getVehicleImage = (model: string) => {
  if (model === 'O3') return o3Image;
  if (model === 'GT5') return gt5Image;
  return o3Image; // Default fallback
};

const RenterDashboard = () => {
  const params = useLocalSearchParams();
  const topUpAmount = params.topUpAmount ? parseInt(params.topUpAmount as string, 10) : 0;
  const deductAmount = params.deductAmount ? parseInt(params.deductAmount as string, 10) : 0;
  
  // State for payment history that can be updated
  const [paymentHistory, setPaymentHistory] = useState(initialPaymentHistory);
  const [showTopUpSuccess, setShowTopUpSuccess] = useState(false);
  const [showDeductAlert, setShowDeductAlert] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  
  // Animation values
  const balanceAnimation = useRef(new Animated.Value(1)).current;
  const successMessageOpacity = useRef(new Animated.Value(0)).current;
  const deductAlertOpacity = useRef(new Animated.Value(0)).current;
  
  // Load vehicles from service
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoadingVehicles(true);
        
        // Initialize vehicle data first
        await initializeVehiclesData();
        
        const vehicles = await getAllVehicles();
        // Filter for only available vehicles
        const available = vehicles.filter(v => v.status === 'Available');
        setAvailableVehicles(available);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        // Fallback to empty array in case of error
        setAvailableVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, []);
  
  // Check login status and get current user
  useEffect(() => {
    let isMounted = true;
    let navigationAttempted = false;

    const checkLoginAndLoadUser = async () => {
      try {
        // Add a small delay to prevent excessive checks
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check both auth systems to ensure we're truly logged in
        const serviceLoggedIn = await isLoggedIn();
        const { isValid, role } = await authStore.validateUser();
        
        if (!isMounted) return;
        
        // If either auth system shows we're not logged in, go to login
        if ((!serviceLoggedIn || !isValid) && !navigationAttempted) {
          // Prevent multiple navigation attempts
          navigationAttempted = true;
          console.log('Not logged in or auth validation failed, redirecting to login screen');
          
          // Try to clear auth data before redirecting
          try {
            await authFix.signOutAndClearSession();
          } catch (err) {
            console.error('Failed to clear auth data:', err);
          }
          
          // Add a longer delay before navigation to prevent loops
          setTimeout(() => {
            if (isMounted) {
              router.replace('/(auth)/login');
            }
          }, 1000);
          return;
        }
        
        // Check if user has correct role
        if (isValid && role !== 'renter') {
          console.log(`User has incorrect role (${role}), redirecting to correct dashboard`);
          if (!navigationAttempted) {
            navigationAttempted = true;
            setTimeout(() => {
              if (isMounted) {
                // Only navigate to valid roles
                if (role === 'admin') {
                  router.replace('/(authenticated)/admin/(screens)/dashboard');
                } else {
                  // If role is invalid, go to login
                  console.log('Invalid role detected, clearing auth data and redirecting to login');
                  authFix.clearAllAuthData().then(() => {
                    router.replace('/(auth)/login');
                  });
                }
              }
            }, 1000);
          }
          return;
        }
        
        // Get user data from both systems and merge if needed
        let email = await getActiveUserEmail();
        if (!email && isValid) {
          // If authService doesn't have email but Supabase does, get it from Supabase
          const { data } = await supabase.auth.getUser();
          email = data.user?.email || null;
          
          // Synchronize with authService
          if (email) {
            console.log('Syncing email to authService:', email);
            const name = data.user?.user_metadata?.name || 'User';
            await loginWithEmail(email, name);
          }
        }
        
        if (email && isMounted) {
          setUserEmail(email);
          const user = await getUserData(email);
          if (isMounted) {
            setUserData(user);
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        // If there's an error, try clearing auth data and redirecting
        if (!navigationAttempted) {
          navigationAttempted = true;
          try {
            await authFix.clearAllAuthData();
          } catch (err) {
            console.error('Failed to clear auth data:', err);
          }
          setTimeout(() => {
            if (isMounted) {
              router.replace('/(auth)/login');
            }
          }, 1000);
        }
      }
    };
    
    checkLoginAndLoadUser();
    
    return () => { 
      isMounted = false;
    };
  }, []);
  
  // Effect to update balance when coming back from payments screen
  useEffect(() => {
    // Initial load of user balance from database
    const loadUserBalance = async () => {
      if (!userEmail) return;
      
      try {
        const balance = await getUserBalance(userEmail);
        setCurrentBalance(balance);
        setPaymentHistory(prev => ({
          ...prev,
          currentBalance: balance
        }));
      } catch (error: any) {
        console.error("Failed to load user balance:", error);
        // Fallback to default balance in case of error
        setCurrentBalance(150);
        setPaymentHistory(prev => ({
          ...prev,
          currentBalance: 150
        }));
      }
    };

    if (userEmail) {
      loadUserBalance();
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    
    // Handle top-up
    if (topUpAmount > 0) {
      // Update the local state and database
      getUserBalance(userEmail).then((latestBalance: number) => {
        // Update the UI with the latest balance from the database
        setCurrentBalance(latestBalance);
        setPaymentHistory(prev => ({
          ...prev,
          currentBalance: latestBalance
        }));
      }).catch((error: any) => {
        console.error("Failed to get latest user balance:", error);
      });
      
      // Show success message
      setShowTopUpSuccess(true);
      
      // Animate the balance amount
      Animated.sequence([
        Animated.timing(balanceAnimation, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(balanceAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Animate the success message
      Animated.sequence([
        Animated.timing(successMessageOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(successMessageOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowTopUpSuccess(false);
      });
      
      // Clear the URL param after using it
      router.setParams({});
    }
    
    // If a deduct amount was passed via route params, update the balance
    if (deductAmount > 0) {
      // Get the latest balance from the database instead of using local state
      getUserBalance(userEmail).then((latestBalance: number) => {
        // No need to update database here as it's already done in vehicle-details.tsx
        // Just update the local UI state
        setCurrentBalance(latestBalance);
        
        // Update payment history with the new transaction
        const transactionDate = new Date();
        setPaymentHistory(prev => ({
          currentBalance: latestBalance,
          penalties: [
            {
              type: 'Rental Payment',
              amount: deductAmount,
              date: transactionDate.toISOString(),
              status: 'Completed',
            },
            ...prev.penalties
          ]
        }));
        
        // Show deduction alert
        setShowDeductAlert(true);
        
        // Animate the deduction alert
        Animated.sequence([
          Animated.timing(deductAlertOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(3000),
          Animated.timing(deductAlertOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowDeductAlert(false);
        });
      }).catch((error: any) => {
        console.error("Failed to get latest user balance:", error);
      });
      
      // Clear the URL param after using it
      router.setParams({});
    }
  }, [topUpAmount, deductAmount, userEmail]);
  
  const handleImageError = (id: number) => {
    console.log(`Failed to load image for vehicle ${id}`);
  };

  const handleTopUp = () => {
    router.push('/(authenticated)/renter/(screens)/payments');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome {userData?.name || 'Back'}!</Text>
        <TouchableOpacity 
          onPress={async () => {
            try {
              await authStore.signOut();
            } catch (error) {
              console.error("Logout error:", error);
            }
          }}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={[styles.card, styles.balanceCard]}>
        <View style={styles.balanceHeader}>
          <Text style={styles.cardTitle}>Your Balance</Text>
          <TouchableOpacity 
            style={styles.topUpButton}
            onPress={() => router.push('/(authenticated)/renter/(screens)/top-up' as any)}
          >
            <Text style={styles.topUpButtonText}>Top Up</Text>
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={[
            styles.balanceContainer, 
            {transform: [{scale: balanceAnimation}]}
          ]}
        >
          <Text style={styles.balanceLabel}>Current Balance:</Text>
          <Text style={styles.balanceAmount}>${currentBalance.toFixed(2)}</Text>
        </Animated.View>
        
        {/* Success Message for Top Up */}
        <Animated.View style={[styles.successMessage, {opacity: successMessageOpacity}]}>
          <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          <Text style={styles.successText}>Added ${topUpAmount.toFixed(2)} to your balance!</Text>
        </Animated.View>
        
        {/* Alert Message for Deduction */}
        <Animated.View style={[styles.deductAlert, {opacity: deductAlertOpacity}]}>
          <Ionicons name="alert-circle" size={18} color="#FF9800" />
          <Text style={styles.deductText}>${deductAmount.toFixed(2)} deducted from balance.</Text>
        </Animated.View>
      </View>

      {/* Available Vehicles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Vehicles</Text>
        
        {loadingVehicles ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading available vehicles...</Text>
          </View>
        ) : availableVehicles.length === 0 ? (
          <View style={styles.noVehiclesContainer}>
            <Ionicons name="car-outline" size={40} color="#ccc" />
            <Text style={styles.noVehiclesText}>No vehicles currently available</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.vehiclesContainer}
          >
            {availableVehicles.map((vehicle) => (
              <TouchableOpacity 
                key={vehicle.id} 
                style={styles.vehicleCard}
                onPress={() => {
                  console.log(`Navigating to vehicle details for ID: ${vehicle.id}`);
                  router.push({
                    pathname: '/(authenticated)/renter/(screens)/vehicle-details',
                    params: { vehicleId: vehicle.id.toString() }
                  } as any);
                }}
              >
                <View style={styles.vehicleImageContainer}>
                  <Image 
                    source={getVehicleImage(vehicle.model)} 
                    style={styles.vehicleImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.batteryIndicator}>
                    <Ionicons name="battery-charging" size={16} color="#fff" />
                    <Text style={styles.batteryText}>{vehicle.batteryPercentage}%</Text>
                  </View>
                </View>
                <View style={styles.vehicleDetails}>
                  <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                  <View style={styles.vehicleSpecs}>
                    <View style={styles.specItem}>
                      <Ionicons name="speedometer-outline" size={14} color="#666" />
                      <Text style={styles.specText}>{vehicle.maxSpeed} km/h</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="analytics-outline" size={14} color="#666" />
                      <Text style={styles.specText}>{vehicle.range} km</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="people-outline" size={14} color="#666" />
                      <Text style={styles.specText}>{vehicle.seatingCapacity} seats</Text>
                    </View>
                  </View>
                  <View style={styles.rentalCostContainer}>
                    <Text style={styles.rentalCostLabel}>Rental Cost:</Text>
                    <Text style={styles.rentalCostValue}>${vehicle.rentalCost}/day</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Payments & Penalties Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payments & Penalties</Text>
        <View style={styles.penaltiesContainer}>
          <Text style={styles.subsectionTitle}>Recent Penalties</Text>
          {paymentHistory.penalties.map((penalty, index) => (
            <View key={index} style={styles.penaltyItem}>
              <View>
                <Text style={styles.penaltyType}>{penalty.type}</Text>
                <Text style={styles.penaltyDate}>{penalty.date}</Text>
              </View>
              <View style={styles.penaltyRight}>
                <Text style={styles.penaltyAmount}>-₹{penalty.amount}</Text>
                <Text style={[styles.penaltyStatus, { 
                  color: penalty.status === 'Paid' ? '#4CAF50' : 
                         penalty.status === 'Pending' ? '#FF9800' : '#F44336'
                }]}>{penalty.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(authenticated)/renter/(screens)/scan-qr' as any)}
          >
            <Ionicons name="qr-code" size={24} color={Colors.light.text} />
            <Text style={styles.actionText}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(authenticated)/renter/(screens)/ride-history' as any)}
          >
            <Ionicons name="time" size={24} color={Colors.light.text} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(authenticated)/renter/(screens)/support' as any)}
          >
            <Ionicons name="help-circle" size={24} color={Colors.light.text} />
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 15,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  vehicleImageContainer: {
    height: 130,
    width: '100%',
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  batteryIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  vehicleInfo: {
    padding: 12,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  vehicleCost: {
    fontSize: 16,
    color: Colors.light.tint,
    marginTop: 4,
  },
  vehicleStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  balanceCard: {
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  balanceContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 0,
  },
  topUpButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  topUpButtonText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 8,
    padding: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  successText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  deductAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 8,
    padding: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  deductText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  penaltiesContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  penaltyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  penaltyType: {
    fontSize: 16,
    color: Colors.light.text,
  },
  penaltyDate: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  penaltyRight: {
    alignItems: 'flex-end',
  },
  penaltyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  penaltyStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.text,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  noVehiclesContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noVehiclesText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  vehiclesContainer: {
    padding: 10,
  },
  vehicleDetails: {
    padding: 10,
  },
  rentalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentalCostLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  rentalCostValue: {
    fontSize: 14,
    color: Colors.light.tint,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  vehicleSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 6,
  },
  specText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default RenterDashboard; 