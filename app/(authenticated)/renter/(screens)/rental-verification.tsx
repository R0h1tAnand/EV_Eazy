import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import * as DocumentPicker from 'expo-document-picker';
import { addRentalRecord, updateVehicle, getVehicleById } from '../../../../services/vehicleService';
import { deductUserBalance } from '../../../../services/databaseService';

export default function RentalVerification() {
  const params = useLocalSearchParams();
  
  // Extract parameters
  const vehicleId = params.vehicleId ? parseInt(String(params.vehicleId), 10) : 0;
  const rentalDays = params.rentalDays ? parseInt(String(params.rentalDays), 10) : 1;
  const totalCost = params.totalCost ? parseFloat(String(params.totalCost)) : 0;
  const userEmail = params.userEmail as string;
  const userName = params.userName as string;
  const userBalance = params.userBalance ? parseFloat(String(params.userBalance)) : 0;
  
  console.log("RentalVerification - Vehicle ID:", vehicleId);
  console.log("RentalVerification - Rental Days:", rentalDays);
  console.log("RentalVerification - Total Cost:", totalCost);
  
  // Form state
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [aadharFile, setAadharFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Information, 2: Document Upload, 3: Confirmation
  
  // Document picker
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setAadharFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };
  
  // Validation for current step
  const validateCurrentStep = () => {
    if (step === 1) {
      if (!destination.trim()) {
        Alert.alert('Error', 'Please enter your destination');
        return false;
      }
      if (!purpose.trim()) {
        Alert.alert('Error', 'Please enter the purpose of rental');
        return false;
      }
      if (!contactNumber.trim() || contactNumber.length < 10) {
        Alert.alert('Error', 'Please enter a valid contact number');
        return false;
      }
      if (!pickupLocation.trim()) {
        Alert.alert('Error', 'Please enter the pickup location');
        return false;
      }
    } else if (step === 2) {
      if (!aadharFile) {
        Alert.alert('Error', 'Please upload your Aadhar card PDF');
        return false;
      }
    }
    return true;
  };
  
  // Handle next step or submit
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleSubmitRental();
      }
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };
  
  // Handle rental submission
  const handleSubmitRental = async () => {
    try {
      setLoading(true);
      
      if (!vehicleId || !userEmail) {
        Alert.alert('Error', 'Missing required information');
        setLoading(false);
        return;
      }
      
      // Get vehicle data
      const vehicle = await getVehicleById(vehicleId);
      if (!vehicle) {
        Alert.alert('Error', 'Vehicle not found');
        setLoading(false);
        return;
      }
      
      // Create rental record
      const rentalData = {
        vehicleId: vehicleId,
        userId: userEmail,
        userName: userName,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (rentalDays * 24 * 60 * 60 * 1000)).toISOString(),
        cost: totalCost,
        status: 'Active' as const,
        destination: destination,
        purpose: purpose,
        contactNumber: contactNumber,
        pickupLocation: pickupLocation,
        aadharVerified: true
      };
      
      // Update vehicle status to 'Rented'
      const updatedVehicle = {
        ...vehicle,
        status: 'Rented' as const
      };
      
      // Add rental record
      await addRentalRecord(rentalData);
      
      // Update vehicle status
      await updateVehicle(updatedVehicle);
      
      // Deduct balance
      await deductUserBalance(userEmail, totalCost);
      
      // Show success message
      Alert.alert(
        'Rental Successful',
        `You have successfully rented the vehicle for ${rentalDays} day${rentalDays > 1 ? 's' : ''}. Enjoy your journey!`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate to dashboard with deduction amount
              router.replace({
                pathname: '/(authenticated)/renter/(screens)/dashboard',
                params: { deductAmount: totalCost.toString() }
              } as any);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error processing rental:', error);
      Alert.alert('Error', 'Failed to process rental. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render information step
  const renderInformationStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Step 1: Rental Information</Text>
      
      <Text style={styles.label}>Destination</Text>
      <TextInput
        style={styles.input}
        value={destination}
        onChangeText={setDestination}
        placeholder="Where are you going?"
        placeholderTextColor="#999"
      />
      
      <Text style={styles.label}>Purpose of Rental</Text>
      <TextInput
        style={styles.input}
        value={purpose}
        onChangeText={setPurpose}
        placeholder="Business, leisure, etc."
        placeholderTextColor="#999"
      />
      
      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        value={contactNumber}
        onChangeText={setContactNumber}
        placeholder="Your phone number"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
      />
      
      <Text style={styles.label}>Pickup Location</Text>
      <TextInput
        style={styles.input}
        value={pickupLocation}
        onChangeText={setPickupLocation}
        placeholder="Where would you like to pick up the vehicle?"
        placeholderTextColor="#999"
      />
    </View>
  );
  
  // Render document upload step
  const renderDocumentStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Step 2: Document Verification</Text>
      
      <Text style={styles.infoText}>
        Please upload a copy of your Aadhar card for identity verification.
        This is required for all rentals and helps ensure security.
      </Text>
      
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={pickDocument}
      >
        <Ionicons name="document-attach" size={24} color="#fff" />
        <Text style={styles.uploadButtonText}>Upload Aadhar PDF</Text>
      </TouchableOpacity>
      
      {aadharFile && (
        <View style={styles.fileInfoContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.fileInfoText} numberOfLines={1} ellipsizeMode="middle">
            {aadharFile.name} ({((aadharFile.size ?? 0) / 1024).toFixed(1)} KB)
          </Text>
        </View>
      )}
      
      <Text style={styles.noteText}>
        Note: Your document will be securely stored and only used for verification purposes.
      </Text>
    </View>
  );
  
  // Render confirmation step
  const renderConfirmationStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Step 3: Confirm Rental</Text>
      
      <View style={styles.confirmationContainer}>
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Total Days:</Text>
          <Text style={styles.confirmationValue}>{rentalDays} day{rentalDays > 1 ? 's' : ''}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Total Cost:</Text>
          <Text style={styles.confirmationValue}>${totalCost.toFixed(2)}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Destination:</Text>
          <Text style={styles.confirmationValue}>{destination}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Purpose:</Text>
          <Text style={styles.confirmationValue}>{purpose}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Contact:</Text>
          <Text style={styles.confirmationValue}>{contactNumber}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Pickup Location:</Text>
          <Text style={styles.confirmationValue}>{pickupLocation}</Text>
        </View>
        
        <View style={styles.confirmationItem}>
          <Text style={styles.confirmationLabel}>Document:</Text>
          <Text style={styles.confirmationValue}>Aadhar Card Uploaded</Text>
        </View>
      </View>
      
      <Text style={styles.termsText}>
        By confirming, you agree to our rental terms and conditions, including responsibility for 
        any damages and returning the vehicle in good condition.
      </Text>
    </View>
  );
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handlePrevStep}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rental Verification</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <View style={styles.stepsContainer}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step >= 1 && styles.activeStepCircle]}>
              <Text style={[styles.stepNumber, step >= 1 && styles.activeStepNumber]}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Information</Text>
          </View>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step >= 2 && styles.activeStepCircle]}>
              <Text style={[styles.stepNumber, step >= 2 && styles.activeStepNumber]}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Documents</Text>
          </View>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step >= 3 && styles.activeStepCircle]}>
              <Text style={[styles.stepNumber, step >= 3 && styles.activeStepNumber]}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Confirmation</Text>
          </View>
        </View>
      </View>
      
      {step === 1 && renderInformationStep()}
      {step === 2 && renderDocumentStep()}
      {step === 3 && renderConfirmationStep()}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.prevButton]}
          onPress={handlePrevStep}
        >
          <Text style={styles.prevButtonText}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.nextButton, loading && styles.disabledButton]}
          onPress={handleNextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 3 ? 'Confirm & Pay' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStepCircle: {
    backgroundColor: Colors.light.tint,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  activeStepNumber: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileInfoText: {
    marginLeft: 8,
    color: '#333',
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  confirmationContainer: {
    marginVertical: 16,
  },
  confirmationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#666',
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  prevButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 