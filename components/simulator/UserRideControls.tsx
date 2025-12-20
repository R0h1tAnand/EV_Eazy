import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, Image, ActivityIndicator, Platform, TextInput, Linking, PermissionsAndroid } from 'react-native';
import MapView, { Polygon, Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSimulator, Vehicle, RentalSession } from '../../store/SimulatorContext';

// Import the default image
const defaultDamageImage = require('../../assets/images/d2.jpg');

// Define __DEV__ for TypeScript
declare const __DEV__: boolean;

// Configuration for the damage assessment server
// Try multiple options for server URL to make it more likely to connect
const SERVER_OPTIONS = [
  'http://localhost:5000/',
  'http://10.0.2.2:5000/',
  'http://192.168.1.100:5000/'
];

const DEFAULT_SERVER_URL = 'http://12.10.5.97:5000/';

// Function to validate the damage assessment response from the server
const validateDamageAssessmentResponse = (data: any): { isValid: boolean, confidence?: number, error?: string } => {
  if (!data) {
    return { isValid: false, error: 'Empty response from server' };
  }
  
  if (typeof data.confidence !== 'number') {
    return { isValid: false, error: 'Invalid response format: missing confidence value' };
  }
  
  if (data.confidence < 0 || data.confidence > 100) {
    return { isValid: false, error: 'Invalid confidence value: must be between 0 and 100' };
  }
  
  return { isValid: true, confidence: data.confidence };
};

const UserRideControls: React.FC = () => {
  const { 
    vehicles, 
    activeSession, 
    startRental, 
    endRental, 
    simulateMovement,
    triggerDamageEvent,
    assessDamage
  } = useSimulator();
  
  const [userId] = useState('user-simulation-123');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [manualLocation, setManualLocation] = useState<{latitude: number, longitude: number} | null>(null);
  
  // Map region
  const initialRegion = {
    latitude: 23.830372,
    longitude: 90.411313,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Auto movement simulation
  const [isAutoMoving, setIsAutoMoving] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);

  // Modal states for image upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [endedSessionId, setEndedSessionId] = useState<string | null>(null);

  // Server URL state
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_SERVER_URL);
  const [showServerConfig, setShowServerConfig] = useState(false);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  const handleStartRental = () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle first');
      return;
    }

    if (selectedVehicle.status !== 'Available') {
      Alert.alert('Error', 'This vehicle is not available for rent');
      return;
    }

    startRental(userId, selectedVehicle.id);
    Alert.alert('Success', `You have rented ${selectedVehicle.model}`);
  };

  const handleEndRental = () => {
    if (!activeSession) {
      Alert.alert('Error', 'No active rental session');
      return;
    }

    const sessionId = endRental(activeSession.id);
    setEndedSessionId(sessionId || null);
    setIsAutoMoving(false);
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    
    // Show upload modal for damage assessment
    setShowUploadModal(true);
  };

  const handleMapPress = (event: any) => {
    if (activeSession) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setManualLocation({ latitude, longitude });
    }
  };

  const moveToLocation = () => {
    if (activeSession && manualLocation) {
      simulateMovement(activeSession.id, manualLocation);
      setManualLocation(null);
    }
  };

  const startAutoMovement = () => {
    if (!activeSession) {
      Alert.alert('Error', 'No active rental session');
      return;
    }

    setIsAutoMoving(true);
    
    // Get the active vehicle
    const activeVehicle = vehicles.find(v => v.id === activeSession.vehicleId);
    if (!activeVehicle) return;
    
    // Start with current location
    let currentLat = activeVehicle.location.latitude;
    let currentLng = activeVehicle.location.longitude;
    
    // Movement simulation
    const interval = setInterval(() => {
      // Random small movement (within 0.0001 to 0.0003 degrees, roughly 10-30 meters)
      const latDelta = (Math.random() * 0.0002 + 0.0001) * (Math.random() > 0.5 ? 1 : -1);
      const lngDelta = (Math.random() * 0.0002 + 0.0001) * (Math.random() > 0.5 ? 1 : -1);
      
      currentLat += latDelta;
      currentLng += lngDelta;
      
      simulateMovement(activeSession.id, {
        latitude: currentLat,
        longitude: currentLng
      });
      
    }, 2000);
    
    setSimulationInterval(interval);
  };

  const stopAutoMovement = () => {
    setIsAutoMoving(false);
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
  };

  const simulateSuddenStop = () => {
    if (!activeSession) {
      Alert.alert('Error', 'No active rental session');
      return;
    }

    triggerDamageEvent(
      activeSession.id,
      'Moderate',
      'Simulated sudden stop'
    );
    
    Alert.alert('Damage Event', 'A sudden stop has been simulated, generating a penalty');
  };

  // Function to pick image from gallery using native functionality
  const pickImage = async () => {
    try {
      // Request storage permissions on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Gallery Permission',
            message: 'App needs access to your gallery',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'You need to grant gallery permission to select images');
          return;
        }
      }
      
      // Open gallery app
      if (Platform.OS === 'android') {
        await Linking.openURL('content://media/internal/images/media');
      } else {
        // iOS
        await Linking.openURL('photos-redirect://');
      }
      
      // Use the default damage image instead of a URL
      Alert.alert(
        'Image Selection',
        'Using the pre-loaded damage image (d2.jpg) for assessment.',
        [{ 
          text: 'Use Default Image', 
          onPress: () => setUploadImage(defaultDamageImage)
        }]
      );
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert(
        'Gallery Access Error',
        'Could not open your gallery. Using the default damage image instead.',
        [{ text: 'OK', onPress: () => setUploadImage(defaultDamageImage) }]
      );
    }
  };
  
  // Function to take photo with camera
  const takePhoto = async () => {
    try {
      // Request camera permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'You need to grant camera permission to take photos');
          return;
        }
      }
      
      // Open camera app
      if (Platform.OS === 'android') {
        await Linking.openURL('intent://camera/#Intent;scheme=camera;package=com.android.camera;end');
      } else {
        // For iOS
        await Linking.openURL('photos-redirect://');
      }
      
      // Use the default damage image
      Alert.alert(
        'Camera',
        'Using the pre-loaded damage image (d2.jpg) for assessment.',
        [{ 
          text: 'Use Default Image', 
          onPress: () => setUploadImage(defaultDamageImage)
        }]
      );
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert(
        'Camera Error',
        'Could not open your camera. Using the default damage image instead.',
        [{ text: 'OK', onPress: () => setUploadImage(defaultDamageImage) }]
      );
    }
  };

  // Function to handle image upload and damage assessment
  const handleUpload = async () => {
    if (!uploadImage || !endedSessionId) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setIsUploading(true);

    try {
      // For local image (from require)
      if (typeof uploadImage === 'number') {
        console.log('Using local image for assessment with server:', serverUrl);
        
        // Create FormData for the image upload
        const formData = new FormData();
        
        // For local images from require, we need to use a different approach
        // We can use the asset module path for expo
        // This is a workaround since direct access to the file isn't straightforward
        formData.append('file', {
          uri: Image.resolveAssetSource(uploadImage).uri,
          name: 'd2.jpg',
          type: 'image/jpeg',
        } as any);

        console.log('Sending image to:', serverUrl);
        
        // Set timeout for the fetch request (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        // Send the image to your API endpoint
        const apiResponse = await fetch(serverUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);

        // Check if the request was successful
        if (apiResponse.ok) {
          // Parse the response to get damage confidence
          const resultText = await apiResponse.text();
          console.log('Server response:', resultText);
          
          // Extract the confidence value from the response
          // The response format is expected to be: 
          // Predicted Damage Type: damage\n\nConfidence Level: 74.81581568717957%
          try {
            const confidenceMatch = resultText.match(/Confidence Level: ([\d.]+)%/);
            if (confidenceMatch && confidenceMatch[1]) {
              const damageConfidence = parseFloat(confidenceMatch[1]);
              if (!isNaN(damageConfidence) && damageConfidence >= 0 && damageConfidence <= 100) {
                processDamageResults(damageConfidence);
              } else {
                throw new Error('Invalid confidence value in server response');
              }
            } else {
              // Try JSON parsing as fallback
              try {
                const result = JSON.parse(resultText);
                const validation = validateDamageAssessmentResponse(result);
                
                if (!validation.isValid) {
                  throw new Error(validation.error);
                }
                
                processDamageResults(validation.confidence!);
              } catch (jsonError) {
                throw new Error('Could not parse server response format');
              }
            }
          } catch (error) {
            console.error('Error parsing response:', error);
            // If we can't extract the confidence value, simulate the damage assessment
            Alert.alert(
              'Response Parsing Error',
              'Could not parse the server response. Using simulated assessment instead.',
              [{ text: 'OK', onPress: () => simulateDamageAssessment() }]
            );
          }
        } else {
          // Handle HTTP errors
          let errorMessage = `Server responded with status: ${apiResponse.status}`;
          
          if (apiResponse.status === 413) {
            errorMessage = 'The image file is too large. Please choose a smaller image.';
          } else if (apiResponse.status === 415) {
            errorMessage = 'Unsupported file format. Please select a valid image file.';
          } else if (apiResponse.status === 500) {
            errorMessage = 'The server encountered an error while processing the image.';
          } else if (apiResponse.status === 503) {
            errorMessage = 'The damage assessment service is currently unavailable.';
          }
          
          throw new Error(errorMessage);
        }
      } else {
        // For other types of images (which shouldn't happen in this implementation)
        simulateDamageAssessment();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      
      // Get error message
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more helpful messages for common network errors
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Server may be unavailable.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network connection failed. Make sure the server is running at ' + serverUrl;
        }
      }
      
      // Fallback to simulation
      Alert.alert(
        'Connection Error',
        `${errorMessage}\n\nUsing simulated mode instead.`,
        [{ text: 'OK', onPress: () => simulateDamageAssessment() }]
      );
    }
  };

  // Function to process damage results
  const processDamageResults = (damageConfidence: number) => {
    // Apply damage assessment based on confidence level
    const penaltyAmount = assessDamage(endedSessionId!, damageConfidence);
    
    setIsUploading(false);
    setShowUploadModal(false);
    setUploadImage(null);
    setEndedSessionId(null);
    
    // Show result
    Alert.alert(
      'Damage Assessment Complete', 
      `Damage detected with ${damageConfidence.toFixed(1)}% confidence.\nPenalty: $${penaltyAmount}.00`,
      [{ text: 'OK', onPress: () => Alert.alert('Success', 'Rental completed') }]
    );
  };

  // Function to simulate damage assessment
  const simulateDamageAssessment = () => {
    // Simulate damage detection with random confidence
    const damageConfidence = Math.random() * 100;
    const penaltyAmount = assessDamage(endedSessionId!, damageConfidence);
    
    setIsUploading(false);
    setShowUploadModal(false);
    setUploadImage(null);
    setEndedSessionId(null);
    
    // Show result
    Alert.alert(
      'Damage Assessment Complete (Simulated)', 
      `Damage detected with ${damageConfidence.toFixed(1)}% confidence.\nPenalty: $${penaltyAmount}.00`,
      [{ text: 'OK', onPress: () => Alert.alert('Success', 'Rental completed') }]
    );
  };

  // Function to handle user attempt to skip upload
  const skipUpload = () => {
    Alert.alert(
      'Image Required',
      'You must upload an image of the vehicle to complete the rental process.',
      [{ text: 'OK' }]
    );
  };

  // Function to test the connection to the damage assessment server
  const testServerConnection = async () => {
    try {
      console.log(`Testing connection to server: ${serverUrl}`);
      
      // Set a timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Try to connect to the server with a GET request
      const response = await fetch(serverUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // Server responded successfully
        const text = await response.text();
        console.log('Server response:', text);
        
        Alert.alert(
          'Connection Successful', 
          `Successfully connected to the damage assessment server at ${serverUrl}\n\nServer response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`
        );
      } else {
        // Server responded with an error
        Alert.alert(
          'Connection Error',
          `Server responded with status: ${response.status}\n\nThe server may be running but not accepting the request format. POST requests with images may still work.`
        );
      }
    } catch (error) {
      console.error('Connection test error:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out after 10 seconds. Server may be unresponsive.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network connection failed. Please check that:\n\n' +
                        '1. The server is running\n' +
                        '2. Your device can reach the server\n' +
                        '3. No firewall is blocking the connection';
        }
      }
      
      Alert.alert('Connection Failed', `Could not connect to ${serverUrl}\n\n${errorMessage}`);
    }
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={[
        styles.vehicleItem,
        selectedVehicle?.id === item.id && styles.selectedVehicleItem
      ]}
      onPress={() => setSelectedVehicle(item)}
    >
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehicleModel}>{item.model}</Text>
        <Text style={styles.vehicleInfo}>Battery: {item.batteryPercentage}%</Text>
        <Text style={styles.vehicleInfo}>Cost: ${item.rentalCost}/hr</Text>
        <Text style={[
          styles.vehicleStatus,
          item.status === 'Available' && styles.statusAvailable,
          item.status === 'Rented' && styles.statusRented
        ]}>
          Status: {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Available Vehicles</Text>
      
      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id}
        horizontal
        style={styles.vehiclesList}
        contentContainerStyle={styles.vehiclesListContent}
        showsHorizontalScrollIndicator={false}
      />
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.startButton, !selectedVehicle && styles.disabledButton]}
          onPress={handleStartRental}
          disabled={!selectedVehicle || activeSession !== null}
        >
          <Text style={styles.actionButtonText}>Start Rental</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.endButton, !activeSession && styles.disabledButton]}
          onPress={handleEndRental}
          disabled={!activeSession}
        >
          <Text style={styles.actionButtonText}>End Rental</Text>
        </TouchableOpacity>
      </View>
      
      {activeSession && (
        <>
          <Text style={styles.sectionTitle}>Ride Simulation</Text>
          
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={initialRegion}
              onPress={handleMapPress}
            >
              {/* Show all vehicles */}
              {vehicles.map((vehicle) => (
                <Marker
                  key={vehicle.id}
                  coordinate={vehicle.location}
                  title={vehicle.model}
                >
                  <View style={[
                    styles.vehicleMarker,
                    vehicle.id === activeSession.vehicleId && styles.activeVehicleMarker
                  ]}>
                    <Ionicons 
                      name="car" 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                </Marker>
              ))}
              
              {/* Show geofence if available for active vehicle */}
              {activeSession && (() => {
                const vehicle = vehicles.find(v => v.id === activeSession.vehicleId);
                if (vehicle?.geofence?.coordinates) {
                  return (
                    <Polygon
                      coordinates={vehicle.geofence.coordinates}
                      strokeColor="#4CAF50"
                      fillColor="rgba(76, 175, 80, 0.3)"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              })()}
              
              {/* Show route */}
              {activeSession && activeSession.route.length > 1 && (
                <Polyline
                  coordinates={activeSession.route}
                  strokeColor="#2196F3"
                  strokeWidth={3}
                />
              )}
              
              {/* Show selected location */}
              {manualLocation && (
                <Marker
                  coordinate={manualLocation}
                  pinColor="#9C27B0"
                  title="Selected Location"
                />
              )}
            </MapView>
            
            {manualLocation && (
              <TouchableOpacity
                style={styles.moveButton}
                onPress={moveToLocation}
              >
                <Text style={styles.moveButtonText}>Move to Selected Location</Text>
              </TouchableOpacity>
            )}
            
            {activeSession && (
              <View style={styles.simulationControls}>
                {!isAutoMoving ? (
                  <TouchableOpacity
                    style={[styles.simulationButton, styles.startAutoButton]}
                    onPress={startAutoMovement}
                  >
                    <Text style={styles.simulationButtonText}>Start Auto Movement</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.simulationButton, styles.stopAutoButton]}
                    onPress={stopAutoMovement}
                  >
                    <Text style={styles.simulationButtonText}>Stop Auto Movement</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.simulationButton, styles.damageButton]}
                  onPress={simulateSuddenStop}
                >
                  <Text style={styles.simulationButtonText}>Simulate Sudden Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {activeSession && (
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionInfoTitle}>Current Session</Text>
              <Text style={styles.sessionInfoText}>
                Duration: {(() => {
                  const duration = Date.now() - activeSession.startTime.getTime();
                  const minutes = Math.floor(duration / (1000 * 60));
                  const seconds = Math.floor((duration % (1000 * 60)) / 1000);
                  return `${minutes}m ${seconds}s`;
                })()}
              </Text>
              <Text style={styles.sessionInfoText}>Cost: ${activeSession.cost.toFixed(2)}</Text>
              <Text style={[
                styles.sessionInfoText,
                activeSession.isOutsideGeofence && styles.warningText
              ]}>
                {activeSession.isOutsideGeofence 
                  ? `⚠️ Outside Geofence for ${Math.floor(activeSession.outsideGeofenceDuration)}s`
                  : 'Inside Designated Area'}
              </Text>
              
              {activeSession.damageEvents.length > 0 && (
                <>
                  <Text style={[styles.sessionInfoText, styles.warningText]}>
                    Damage Events: {activeSession.damageEvents.length}
                  </Text>
                  <Text style={[styles.sessionInfoText, styles.warningText]}>
                    Total Penalties: ${activeSession.damageEvents.reduce((sum, event) => sum + event.penaltyAmount, 0).toFixed(2)}
                  </Text>
                </>
              )}
            </View>
          )}
        </>
      )}
      
      {/* Image Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          Alert.alert(
            'Image Required',
            'You must upload an image of the vehicle to complete the rental process.',
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vehicle Damage Assessment</Text>
            <Text style={styles.modalText}>
              Please upload a photo of the vehicle to complete the rental process.
              The image will be analyzed for damage detection.
            </Text>
            
            <Text style={styles.instructionText}>
              <Ionicons name="information-circle" size={16} color="#2196F3" /> 
              Important: For this demonstration, a simulated image will be used after you select from your gallery or take a photo.
            </Text>
            
            {uploadImage ? (
              <View style={styles.previewContainer}>
                <Image source={typeof uploadImage === 'number' ? uploadImage : { uri: uploadImage }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setUploadImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#f44336" />
                </TouchableOpacity>
                <Text style={styles.previewText}>
                  {typeof uploadImage === 'number' 
                    ? '(Local test image d2.jpg will be sent to server)' 
                    : 'Selected image'}
                </Text>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Ionicons name="images" size={24} color="#fff" />
                  <Text style={styles.uploadButtonText}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.modalActions}>
              {!isUploading ? (
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.uploadSubmitButton,
                    !uploadImage && styles.disabledButton
                  ]} 
                  onPress={handleUpload}
                  disabled={!uploadImage}
                >
                  <Text style={styles.uploadSubmitButtonText}>
                    {typeof uploadImage === 'number' 
                      ? 'Send to Assessment Server' 
                      : 'Upload & Analyze Image'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingText}>Processing image...</Text>
                </View>
              )}
            </View>
            
            {/* Server info and connection test */}
            <View style={styles.serverInfoContainer}>
              <TouchableOpacity 
                style={styles.serverHeaderContainer}
                onPress={() => setShowServerConfig(!showServerConfig)}
              >
                <Text style={styles.serverInfoText}>
                  Server: {serverUrl}
                </Text>
                <Ionicons 
                  name={showServerConfig ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showServerConfig && (
                <View style={styles.serverConfigContainer}>
                  <Text style={styles.serverConfigLabel}>Change server URL:</Text>
                  <TextInput
                    style={styles.serverUrlInput}
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    placeholder="Enter server URL"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  
                  <Text style={styles.serverConfigLabel}>Quick Select:</Text>
                  <View style={styles.serverOptionContainer}>
                    {SERVER_OPTIONS.map((url, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.serverOptionButton,
                          serverUrl === url && styles.serverOptionButtonActive
                        ]}
                        onPress={() => setServerUrl(url)}
                      >
                        <Text style={styles.serverOptionText}>{url.replace('http://', '')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.testConnectionButton}
                onPress={testServerConnection}
                disabled={isUploading}
              >
                <Text style={styles.testConnectionText}>Test Connection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  vehiclesList: {
    marginBottom: 15,
  },
  vehiclesListContent: {
    paddingRight: 15,
  },
  vehicleItem: {
    width: 150,
    marginRight: 10,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedVehicleItem: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#f0f9f0',
  },
  vehicleDetails: {
    alignItems: 'center',
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  vehicleStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statusAvailable: {
    color: '#4CAF50',
  },
  statusRented: {
    color: '#f44336',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  endButton: {
    backgroundColor: '#f44336',
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 300,
  },
  moveButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 5,
  },
  moveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  simulationControls: {
    flexDirection: 'row',
    marginTop: 10,
  },
  simulationButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  startAutoButton: {
    backgroundColor: '#2196F3',
    marginRight: 5,
  },
  stopAutoButton: {
    backgroundColor: '#FF9800',
    marginRight: 5,
  },
  damageButton: {
    backgroundColor: '#9C27B0',
    marginLeft: 5,
  },
  simulationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sessionInfo: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sessionInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  warningText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  vehicleMarker: {
    backgroundColor: '#2196F3',
    borderRadius: 15,
    padding: 5,
  },
  activeVehicleMarker: {
    backgroundColor: '#4CAF50',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 15,
  },
  modalActions: {
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  uploadSubmitButton: {
    backgroundColor: '#4CAF50',
  },
  uploadSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    lineHeight: 20,
  },
  serverInfoContainer: {
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  serverInfoText: {
    fontSize: 12,
    color: '#666',
  },
  testConnectionButton: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testConnectionText: {
    fontSize: 12,
    color: '#666',
  },
  serverHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  serverConfigContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  serverConfigLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  serverUrlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    marginBottom: 10,
  },
  serverOptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  serverOptionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  serverOptionButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  serverOptionText: {
    fontSize: 10,
    color: '#666',
  },
  previewText: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default UserRideControls; 