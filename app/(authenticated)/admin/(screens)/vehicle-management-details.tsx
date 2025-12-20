import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  Vehicle, 
  RentalRecord,
  getVehicleById, 
  updateVehicle,
  deleteVehicle,
  getVehicleRentalHistory 
} from '../../../../services/vehicleService';

export default function VehicleManagementDetails() {
  const params = useLocalSearchParams();
  console.log("VehicleManagementDetails - Params:", JSON.stringify(params));
  
  const vehicleId = params.vehicleId ? parseInt(String(params.vehicleId), 10) : 0;
  console.log("VehicleManagementDetails - Vehicle ID:", vehicleId);
  console.log("VehicleManagementDetails - Param type:", typeof params.vehicleId);
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [rentalHistory, setRentalHistory] = useState<RentalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<Omit<Vehicle, 'id'>>({
    model: '',
    batteryPercentage: 100,
    rentalCost: 0,
    mileage: 0,
    range: 0,
    maxSpeed: 0,
    seatingCapacity: 0,
    status: 'Available'
  });

  useEffect(() => {
    loadVehicleData();
  }, [vehicleId]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      console.log("loadVehicleData - Loading data for vehicle ID:", vehicleId);
      
      if (!vehicleId) {
        console.error("loadVehicleData - Invalid vehicle ID:", vehicleId);
        Alert.alert('Error', 'Invalid vehicle ID');
        return;
      }

      // Load vehicle and rental history
      const vehicleData = await getVehicleById(vehicleId);
      if (!vehicleData) {
        Alert.alert('Error', 'Vehicle not found');
        router.back();
        return;
      }
      
      setVehicle(vehicleData);
      
      // Initialize form with current values
      setVehicleForm({
        model: vehicleData.model,
        batteryPercentage: vehicleData.batteryPercentage,
        rentalCost: vehicleData.rentalCost,
        mileage: vehicleData.mileage,
        range: vehicleData.range,
        maxSpeed: vehicleData.maxSpeed,
        seatingCapacity: vehicleData.seatingCapacity,
        status: vehicleData.status,
        imageUrl: vehicleData.imageUrl
      });
      
      // Load rental history
      const history = await getVehicleRentalHistory(vehicleId);
      setRentalHistory(history);
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      Alert.alert('Error', 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this vehicle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (vehicle) {
                await deleteVehicle(vehicle.id);
                Alert.alert('Success', 'Vehicle deleted successfully');
                router.replace('/(authenticated)/admin/(screens)/vehicle-management');
              }
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUpdateVehicle = async () => {
    if (!vehicle) return;
    
    // Basic validation
    if (!vehicleForm.model) {
      Alert.alert('Error', 'Please enter a model name');
      return;
    }

    if (vehicleForm.rentalCost <= 0) {
      Alert.alert('Error', 'Rental cost must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      const updatedVehicle = await updateVehicle({
        ...vehicleForm,
        id: vehicle.id
      });
      
      setVehicle(updatedVehicle);
      setModalVisible(false);
      Alert.alert('Success', 'Vehicle updated successfully');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      Alert.alert('Error', 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field: keyof typeof vehicleForm, value: any) => {
    setVehicleForm(prev => ({
      ...prev,
      [field]: field === 'model' || field === 'status' || field === 'imageUrl' 
        ? value 
        : Number(value)
    }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF5252" />
        <Text style={styles.errorText}>Vehicle not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Return to Vehicle Management</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{vehicle.model}</Text>
        <View style={[styles.statusBadge, 
          { backgroundColor: 
            vehicle.status === 'Available' ? '#4CAF50' : 
            vehicle.status === 'Rented' ? '#FF9800' : '#F44336' 
          }]}>
          <Text style={styles.statusText}>{vehicle.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="battery-charging" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{vehicle.batteryPercentage}%</Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color="#2196F3" />
            <Text style={styles.statValue}>${vehicle.rentalCost}</Text>
            <Text style={styles.statLabel}>Per Day</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{vehicle.mileage}</Text>
            <Text style={styles.statLabel}>Mileage (km/kWh)</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specifications</Text>
        <View style={styles.specsList}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Model</Text>
            <Text style={styles.specValue}>{vehicle.model}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Range</Text>
            <Text style={styles.specValue}>{vehicle.range} km</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Max Speed</Text>
            <Text style={styles.specValue}>{vehicle.maxSpeed} km/h</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Seating Capacity</Text>
            <Text style={styles.specValue}>{vehicle.seatingCapacity}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Status</Text>
            <Text style={styles.specValue}>{vehicle.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Rental History</Text>
        {rentalHistory.length === 0 ? (
          <Text style={styles.noDataText}>No rental history available</Text>
        ) : (
          rentalHistory.map((rental, index) => (
            <View key={index} style={styles.rentalItem}>
              <View style={styles.rentalHeader}>
                <Text style={styles.rentalUser}>{rental.userName}</Text>
                <View style={[
                  styles.rentalStatusBadge,
                  { backgroundColor: 
                    rental.status === 'Active' ? '#2196F3' : 
                    rental.status === 'Completed' ? '#4CAF50' : '#F44336' 
                  }
                ]}>
                  <Text style={styles.rentalStatusText}>{rental.status}</Text>
                </View>
              </View>
              <View style={styles.rentalInfo}>
                <Text style={styles.rentalDates}>
                  <Text style={styles.boldText}>Start:</Text> {new Date(rental.startDate).toLocaleDateString()}
                  {rental.endDate && (
                    <Text> | <Text style={styles.boldText}>End:</Text> {new Date(rental.endDate).toLocaleDateString()}</Text>
                  )}
                </Text>
                <Text style={styles.rentalCost}>
                  <Text style={styles.boldText}>Cost:</Text> ${rental.cost}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]}
          onPress={handleDeleteVehicle}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Delete Vehicle</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Vehicle Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {vehicle.model}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.model}
                onChangeText={(text) => updateFormField('model', text)}
                placeholder="Enter model name"
              />
              
              <Text style={styles.inputLabel}>Rental Cost ($/day)</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.rentalCost.toString()}
                onChangeText={(text) => updateFormField('rentalCost', text)}
                keyboardType="numeric"
                placeholder="Enter rental cost"
              />
              
              <Text style={styles.inputLabel}>Battery Percentage</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.batteryPercentage.toString()}
                onChangeText={(text) => updateFormField('batteryPercentage', text)}
                keyboardType="numeric"
                placeholder="Enter battery percentage"
              />
              
              <Text style={styles.inputLabel}>Mileage (km/kWh)</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.mileage.toString()}
                onChangeText={(text) => updateFormField('mileage', text)}
                keyboardType="numeric"
                placeholder="Enter mileage"
              />
              
              <Text style={styles.inputLabel}>Range (km)</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.range.toString()}
                onChangeText={(text) => updateFormField('range', text)}
                keyboardType="numeric"
                placeholder="Enter range"
              />
              
              <Text style={styles.inputLabel}>Max Speed (km/h)</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.maxSpeed.toString()}
                onChangeText={(text) => updateFormField('maxSpeed', text)}
                keyboardType="numeric"
                placeholder="Enter max speed"
              />
              
              <Text style={styles.inputLabel}>Seating Capacity</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.seatingCapacity.toString()}
                onChangeText={(text) => updateFormField('seatingCapacity', text)}
                keyboardType="numeric"
                placeholder="Enter seating capacity"
              />
              
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {['Available', 'Rented', 'Maintenance'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      vehicleForm.status === status && styles.statusButtonActive,
                      { backgroundColor: 
                        status === 'Available' ? '#4CAF50' : 
                        status === 'Rented' ? '#FFC107' : '#F44336' 
                      }
                    ]}
                    onPress={() => updateFormField('status', status)}
                  >
                    <Text style={styles.statusButtonText}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Image URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={vehicleForm.imageUrl || ''}
                onChangeText={(text) => updateFormField('imageUrl', text)}
                placeholder="Enter image URL"
              />
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdateVehicle}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  specsList: {
    gap: 10,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
  },
  specValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 15,
  },
  rentalItem: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rentalUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  rentalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rentalStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rentalInfo: {
    marginLeft: 4,
  },
  rentalDates: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rentalCost: {
    fontSize: 12,
    color: '#666',
  },
  boldText: {
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  statusButtonActive: {
    borderWidth: 2,
    borderColor: '#333',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 