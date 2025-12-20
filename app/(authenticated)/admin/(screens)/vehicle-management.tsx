import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { 
  Vehicle, 
  RentalRecord,
  getAllVehicles, 
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleRentalHistory
} from '../../../../services/vehicleService';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
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
  const [rentals, setRentals] = useState<RentalRecord[]>([]);
  const [showRentals, setShowRentals] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getAllVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleForm({
      model: '',
      batteryPercentage: 100,
      rentalCost: 0,
      mileage: 0,
      range: 0,
      maxSpeed: 0,
      seatingCapacity: 0,
      status: 'Available'
    });
    setModalVisible(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleForm({
      model: vehicle.model,
      batteryPercentage: vehicle.batteryPercentage,
      rentalCost: vehicle.rentalCost,
      mileage: vehicle.mileage,
      range: vehicle.range,
      maxSpeed: vehicle.maxSpeed,
      seatingCapacity: vehicle.seatingCapacity,
      status: vehicle.status,
      imageUrl: vehicle.imageUrl
    });
    setModalVisible(true);
  };

  const handleViewRentals = async (vehicle: Vehicle) => {
    try {
      setLoading(true);
      const rentalHistory = await getVehicleRentalHistory(vehicle.id);
      setRentals(rentalHistory);
      setSelectedVehicle(vehicle);
      setShowRentals(true);
    } catch (error) {
      console.error(`Error loading rental history for vehicle ${vehicle.id}:`, error);
      Alert.alert('Error', 'Failed to load rental history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this vehicle?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const success = await deleteVehicle(vehicle.id);
              if (success) {
                setVehicles(prevVehicles => prevVehicles.filter(v => v.id !== vehicle.id));
                Alert.alert('Success', 'Vehicle deleted successfully');
              } else {
                Alert.alert('Error', 'Vehicle not found');
              }
            } catch (error) {
              console.error(`Error deleting vehicle ${vehicle.id}:`, error);
              Alert.alert('Error', 'Failed to delete vehicle');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveVehicle = async () => {
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
      let updatedVehicle: Vehicle;

      if (selectedVehicle) {
        // Update existing vehicle
        updatedVehicle = await updateVehicle({
          ...vehicleForm,
          id: selectedVehicle.id
        });

        setVehicles(prevVehicles => 
          prevVehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v)
        );
        Alert.alert('Success', 'Vehicle updated successfully');
      } else {
        // Add new vehicle
        updatedVehicle = await addVehicle(vehicleForm);
        setVehicles(prevVehicles => [...prevVehicles, updatedVehicle]);
        Alert.alert('Success', 'Vehicle added successfully');
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', 'Failed to save vehicle');
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

  if (loading && vehicles.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicle Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddVehicle}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Vehicle</Text>
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No vehicles found</Text>
          <Text style={styles.emptyStateSubtext}>Add your first vehicle to get started</Text>
        </View>
      ) : (
        <View style={styles.vehicleList}>
          {vehicles.map(vehicle => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.vehicleCardHeader}>
                <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: 
                    vehicle.status === 'Available' ? '#4CAF50' : 
                    vehicle.status === 'Rented' ? '#FFC107' : '#F44336' 
                  }
                ]}>
                  <Text style={styles.statusText}>{vehicle.status}</Text>
                </View>
              </View>
              
              <View style={styles.vehicleDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Rental Cost</Text>
                    <Text style={styles.detailValue}>${vehicle.rentalCost}/day</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="battery-charging-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Battery</Text>
                    <Text style={styles.detailValue}>{vehicle.batteryPercentage}%</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="speedometer-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Mileage</Text>
                    <Text style={styles.detailValue}>{vehicle.mileage} km/kWh</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="navigate-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Range</Text>
                    <Text style={styles.detailValue}>{vehicle.range} km</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="flash-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Max Speed</Text>
                    <Text style={styles.detailValue}>{vehicle.maxSpeed} km/h</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Seats</Text>
                    <Text style={styles.detailValue}>{vehicle.seatingCapacity}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.vehicleCardActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditVehicle(vehicle)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => handleViewRentals(vehicle)}
                >
                  <Ionicons name="list-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Rentals</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.detailsButton]}
                  onPress={() => {
                    console.log(`Navigating to vehicle details for ID: ${vehicle.id}`);
                    router.push({
                      pathname: '/(authenticated)/admin/(screens)/vehicle-management-details',
                      params: { vehicleId: vehicle.id.toString() }
                    } as any);
                  }}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteVehicle(vehicle)}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Modal for adding/editing vehicles */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedVehicle ? `Edit ${selectedVehicle.model}` : 'Add New Vehicle'}
              </Text>
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
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveVehicle}
                >
                  <Text style={styles.saveButtonText}>Save Vehicle</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal for viewing rental history */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRentals}
        onRequestClose={() => setShowRentals(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedVehicle ? `${selectedVehicle.model} Rental History` : 'Rental History'}
              </Text>
              <TouchableOpacity onPress={() => setShowRentals(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {rentals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No rental history</Text>
                <Text style={styles.emptyStateSubtext}>This vehicle has not been rented yet</Text>
              </View>
            ) : (
              <FlatList
                data={rentals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.rentalItem}>
                    <View style={styles.rentalHeader}>
                      <Text style={styles.rentalUser}>{item.userName}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: 
                          item.status === 'Active' ? '#2196F3' : 
                          item.status === 'Completed' ? '#4CAF50' : '#F44336' 
                        }
                      ]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.rentalDetails}>
                      <Text style={styles.rentalDates}>
                        <Text style={styles.boldText}>Start:</Text> {new Date(item.startDate).toLocaleDateString()}
                        {item.endDate && (
                          <Text> | <Text style={styles.boldText}>End:</Text> {new Date(item.endDate).toLocaleDateString()}</Text>
                        )}
                      </Text>
                      <Text style={styles.rentalCost}>
                        <Text style={styles.boldText}>Cost:</Text> ${item.cost}
                      </Text>
                    </View>
                  </View>
                )}
                style={styles.rentalList}
              />
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={() => setShowRentals(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#666',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  vehicleList: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleDetails: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  vehicleCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
  },
  editButton: {
    backgroundColor: '#fff8e1',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  viewButtonText: {
    color: '#2196F3',
  },
  editButtonText: {
    color: '#FFC107',
  },
  deleteButtonText: {
    color: '#F44336',
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
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
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    margin: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rentalList: {
    padding: 16,
    maxHeight: 300,
  },
  rentalItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rentalDetails: {
    marginLeft: 4,
  },
  rentalDates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rentalCost: {
    fontSize: 14,
    color: '#666',
  },
  boldText: {
    fontWeight: 'bold',
  },
  detailsButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  detailsButtonText: {
    color: '#4CAF50',
  },
}); 