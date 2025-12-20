import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { Vehicle, getVehicleById, addRentalRecord, updateVehicle } from '../../../../services/vehicleService';
import { getUserBalance, deductUserBalance } from '../../../../services/databaseService';
import { getActiveUserEmail, getUserData } from '../../../../services/authService';

// Import the images from assets
const o3Image = require('../../../../assets/images/o3.jpg');
const gt5Image = require('../../../../assets/images/gt5.jpg');

// Helper function to get image based on model
const getVehicleImage = (model: string) => {
  if (model === 'O3') return o3Image;
  if (model === 'GT5') return gt5Image;
  return o3Image; // Default fallback
};

export default function VehicleDetails() {
  const params = useLocalSearchParams();
  // Ensure vehicleId is parsed correctly
  const vehicleId = params.vehicleId ? parseInt(String(params.vehicleId), 10) : 0;
  
  // Add logging for debugging
  console.log("Vehicle Details Screen - Params:", JSON.stringify(params));
  console.log("Vehicle Details Screen - Vehicle ID:", vehicleId);
  console.log("Vehicle Details Screen - Param type:", typeof params.vehicleId);
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [userBalance, setUserBalance] = useState<number>(0);
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [isRenting, setIsRenting] = useState(false);
  
  useEffect(() => {
    const loadVehicleAndUserData = async () => {
      try {
        setLoading(true);
        
        // Load vehicle details
        if (vehicleId) {
          console.log("Attempting to load vehicle with ID:", vehicleId);
          const vehicleData = await getVehicleById(vehicleId);
          console.log("Vehicle data loaded:", vehicleData ? "Success" : "Failed");
          
          if (vehicleData) {
            console.log("Vehicle Model:", vehicleData.model);
            setVehicle(vehicleData);
          } else {
            console.error("Vehicle data is null or undefined for ID:", vehicleId);
            Alert.alert("Error", "Vehicle not found");
          }
        } else {
          console.error("Invalid vehicle ID:", vehicleId);
          Alert.alert("Error", "Invalid vehicle ID");
        }
        
        // Get user information
        const email = await getActiveUserEmail();
        if (email) {
          setUserEmail(email);
          const userData = await getUserData(email);
          if (userData) {
            setUserName(userData.name || 'User');
          }
          
          // Get user balance
          const balance = await getUserBalance(email);
          setUserBalance(balance);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load vehicle details');
      } finally {
        setLoading(false);
      }
    };
    
    loadVehicleAndUserData();
  }, [vehicleId]);
  
  const handleRentVehicle = async () => {
    if (!vehicle || !userEmail) {
      Alert.alert('Error', 'Vehicle or user information not available');
      return;
    }
    
    // Calculate rental cost
    const totalCost = vehicle.rentalCost * rentalDays;
    
    // Check if user has enough balance
    if (userBalance < totalCost) {
      Alert.alert(
        'Insufficient Balance',
        `Your balance ($${userBalance}) is not enough to rent this vehicle for ${rentalDays} day${rentalDays > 1 ? 's' : ''}. The total cost is $${totalCost}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Top Up Balance', 
            onPress: () => {
              // Navigate back to dashboard first, then to top-up
              router.replace('/authenticated/renter/screens/dashboard' as any)
            }
          }
        ]
      );
      return;
    }
    
    // Navigate to rental verification screen with required details
    router.push({
      pathname: '/(authenticated)/renter/(screens)/rental-verification',
      params: {
        vehicleId: vehicle.id.toString(),
        rentalDays: rentalDays.toString(),
        totalCost: totalCost.toString(),
        userEmail: userEmail,
        userName: userName,
        userBalance: userBalance.toString()
      }
    } as any);
  };
  
  const handleAdjustDays = (increment: boolean) => {
    if (increment) {
      if (rentalDays < 30) { // Set max rental days to 30
        setRentalDays(prev => prev + 1);
      }
    } else {
      if (rentalDays > 1) {
        setRentalDays(prev => prev - 1);
      }
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }
  
  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Vehicle not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Calculate total cost
  const totalCost = vehicle.rentalCost * rentalDays;
  
  return (
    <ScrollView style={styles.container}>
      {/* Vehicle Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={getVehicleImage(vehicle.model)}
          style={styles.vehicleImage}
          resizeMode="cover"
        />
        <View style={styles.modelBadge}>
          <Text style={styles.modelText}>{vehicle.model}</Text>
        </View>
      </View>

      {/* Main Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.modelName}>{vehicle.model}</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                {backgroundColor: vehicle.status === 'Available' ? '#4CAF50' : '#F44336'}
              ]}>
                <Text style={styles.statusText}>{vehicle.status}</Text>
              </View>
              {vehicle.status !== 'Available' && (
                <Text style={styles.notAvailableText}>This vehicle is currently not available for rent</Text>
              )}
            </View>
          </View>
          <Text style={styles.price}>${vehicle.rentalCost}<Text style={styles.perDay}>/day</Text></Text>
        </View>

        {/* Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Ionicons name="battery-charging" size={24} color="#4CAF50" />
              <View style={styles.specTextContainer}>
                <Text style={styles.specLabel}>Battery</Text>
                <Text style={styles.specValue}>{vehicle.batteryPercentage}%</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="speedometer-outline" size={24} color="#2196F3" />
              <View style={styles.specTextContainer}>
                <Text style={styles.specLabel}>Max Speed</Text>
                <Text style={styles.specValue}>{vehicle.maxSpeed} km/h</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="analytics-outline" size={24} color="#FF9800" />
              <View style={styles.specTextContainer}>
                <Text style={styles.specLabel}>Range</Text>
                <Text style={styles.specValue}>{vehicle.range} km</Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="people-outline" size={24} color="#9C27B0" />
              <View style={styles.specTextContainer}>
                <Text style={styles.specLabel}>Seating</Text>
                <Text style={styles.specValue}>{vehicle.seatingCapacity} seats</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rental Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Duration</Text>
          <View style={styles.durationContainer}>
            <TouchableOpacity 
              style={[styles.durationButton, rentalDays <= 1 && styles.disabledButton]}
              onPress={() => handleAdjustDays(false)}
              disabled={rentalDays <= 1}
            >
              <Ionicons name="remove" size={24} color={rentalDays <= 1 ? "#ccc" : "#333"} />
            </TouchableOpacity>
            <View style={styles.daysContainer}>
              <Text style={styles.daysValue}>{rentalDays}</Text>
              <Text style={styles.daysLabel}>day{rentalDays > 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.durationButton, rentalDays >= 30 && styles.disabledButton]}
              onPress={() => handleAdjustDays(true)}
              disabled={rentalDays >= 30}
            >
              <Ionicons name="add" size={24} color={rentalDays >= 30 ? "#ccc" : "#333"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Rental Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Daily Rate</Text>
              <Text style={styles.summaryValue}>${vehicle.rentalCost.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{rentalDays} day{rentalDays > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalValue}>${totalCost.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={[
                styles.balanceValue, 
                userBalance < totalCost ? styles.insufficientBalance : {}
              ]}>
                ${userBalance.toFixed(2)}
                {userBalance < totalCost && (
                  <Text style={styles.insufficientBalanceText}> (Insufficient)</Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.rentButton,
              (vehicle.status !== 'Available' || userBalance < totalCost) && styles.disabledButton
            ]}
            onPress={handleRentVehicle}
            disabled={vehicle.status !== 'Available' || userBalance < totalCost || isRenting}
          >
            {isRenting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="car-sport" size={20} color="#fff" />
                <Text style={styles.rentButtonText}>Rent Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  modelBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  modelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailsContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  notAvailableText: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  perDay: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  specTextContainer: {
    marginLeft: 12,
  },
  specLabel: {
    fontSize: 12,
    color: '#666',
  },
  specValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  durationButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  daysContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  daysValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  daysLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  insufficientBalance: {
    color: '#FF5252',
  },
  insufficientBalanceText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  rentButton: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  }
}); 