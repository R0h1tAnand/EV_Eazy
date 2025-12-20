import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import MapView, { Polygon, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSimulator, Vehicle } from '../../store/SimulatorContext';

const AdminVehicleControls: React.FC = () => {
  const { vehicles, addVehicle, setGeofence } = useSimulator();
  
  // New vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    model: '',
    batteryPercentage: 100,
    rentalCost: 25,
    location: {
      latitude: 23.830372,
      longitude: 90.411313,
    },
  });

  // Geofence drawing state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isDrawingGeofence, setIsDrawingGeofence] = useState(false);
  const [geofenceCoordinates, setGeofenceCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  
  // Map region
  const initialRegion = {
    latitude: 23.830372,
    longitude: 90.411313,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handleAddVehicle = () => {
    if (!newVehicle.model) {
      Alert.alert('Error', 'Please enter a vehicle model');
      return;
    }

    addVehicle({
      model: newVehicle.model,
      batteryPercentage: newVehicle.batteryPercentage,
      rentalCost: newVehicle.rentalCost,
      status: 'Available',
      location: newVehicle.location,
    });

    // Reset form
    setNewVehicle({
      model: '',
      batteryPercentage: 100,
      rentalCost: 25,
      location: {
        latitude: 23.830372,
        longitude: 90.411313,
      },
    });

    Alert.alert('Success', 'Vehicle added successfully');
  };

  const handleMapPress = (event: any) => {
    if (isDrawingGeofence) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setGeofenceCoordinates(prev => [...prev, { latitude, longitude }]);
    }
  };

  const startDrawingGeofence = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setIsDrawingGeofence(true);
    setGeofenceCoordinates([]);
  };

  const finishDrawingGeofence = () => {
    if (selectedVehicleId && geofenceCoordinates.length > 2) {
      // Close the polygon by adding the first point again
      const closedGeofence = [...geofenceCoordinates, geofenceCoordinates[0]];
      setGeofence(selectedVehicleId, closedGeofence);
      setIsDrawingGeofence(false);
      setGeofenceCoordinates([]);
      setSelectedVehicleId(null);
      Alert.alert('Success', 'Geofence set successfully');
    } else {
      Alert.alert('Error', 'Please draw a valid geofence with at least 3 points');
    }
  };

  const cancelDrawingGeofence = () => {
    setIsDrawingGeofence(false);
    setGeofenceCoordinates([]);
    setSelectedVehicleId(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Add New Vehicle</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={newVehicle.model}
          onChangeText={(text) => setNewVehicle({ ...newVehicle, model: text })}
          placeholder="e.g., O3, GT5"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Battery Percentage</Text>
        <TextInput
          style={styles.input}
          value={newVehicle.batteryPercentage.toString()}
          onChangeText={(text) => {
            const value = parseInt(text);
            if (!isNaN(value) && value >= 0 && value <= 100) {
              setNewVehicle({ ...newVehicle, batteryPercentage: value });
            }
          }}
          keyboardType="numeric"
          placeholder="0-100"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Rental Cost (per hour)</Text>
        <TextInput
          style={styles.input}
          value={newVehicle.rentalCost.toString()}
          onChangeText={(text) => {
            const value = parseFloat(text);
            if (!isNaN(value) && value > 0) {
              setNewVehicle({ ...newVehicle, rentalCost: value });
            }
          }}
          keyboardType="numeric"
          placeholder="e.g., 25"
        />
      </View>
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle}>
        <Text style={styles.addButtonText}>Add Vehicle</Text>
      </TouchableOpacity>
      
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Vehicle Management</Text>
      
      {vehicles.length === 0 ? (
        <Text style={styles.noVehiclesText}>No vehicles added yet</Text>
      ) : (
        <View>
          {vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleItem}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                <Text style={styles.vehicleStatus}>Status: {vehicle.status}</Text>
                <Text>Battery: {vehicle.batteryPercentage}%</Text>
                <Text>Rental Cost: ${vehicle.rentalCost}/hr</Text>
              </View>
              
              <TouchableOpacity
                style={styles.geofenceButton}
                onPress={() => startDrawingGeofence(vehicle.id)}
              >
                <Text style={styles.geofenceButtonText}>
                  {vehicle.geofence ? 'Update Geofence' : 'Set Geofence'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {isDrawingGeofence && (
        <View style={styles.mapContainer}>
          <Text style={styles.mapTitle}>Draw Geofence</Text>
          <Text style={styles.mapInstructions}>
            Tap on the map to create geofence boundaries
          </Text>
          
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
          >
            {geofenceCoordinates.map((coord, index) => (
              <Marker
                key={index}
                coordinate={coord}
                pinColor="#4CAF50"
                title={`Point ${index + 1}`}
              />
            ))}
            
            {geofenceCoordinates.length > 2 && (
              <Polygon
                coordinates={geofenceCoordinates}
                strokeColor="#4CAF50"
                fillColor="rgba(76, 175, 80, 0.3)"
                strokeWidth={2}
              />
            )}
            
            {vehicles.map((vehicle) => (
              <Marker
                key={vehicle.id}
                coordinate={vehicle.location}
                title={vehicle.model}
              >
                <View style={styles.vehicleMarker}>
                  <Ionicons name="car" size={24} color="#fff" />
                </View>
              </Marker>
            ))}
          </MapView>
          
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelDrawingGeofence}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={finishDrawingGeofence}>
              <Text style={styles.saveButtonText}>Save Geofence</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noVehiclesText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
  vehicleItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
  },
  vehicleInfo: {
    marginBottom: 10,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleStatus: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  geofenceButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  geofenceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  mapInstructions: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 10,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vehicleMarker: {
    backgroundColor: '#2196F3',
    borderRadius: 15,
    padding: 5,
  },
});

export default AdminVehicleControls; 