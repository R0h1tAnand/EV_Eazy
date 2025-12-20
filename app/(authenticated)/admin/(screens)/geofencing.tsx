import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Polygon, Marker } from 'react-native-maps';
import type { LatLng, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../../constants/Colors';

type Coordinate = LatLng;

const GeofencingScreen: React.FC = () => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = {
    latitude: 23.830372,
    longitude: 90.411313,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handleMapPress = (event: any) => {
    console.log('Map pressed:', event.nativeEvent);
    if (isDrawing) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      console.log('Adding point:', { latitude, longitude });
      setCoordinates(prev => [...prev, { latitude, longitude }]);
    }
  };

  const startDrawing = () => {
    console.log('Starting to draw');
    setIsDrawing(true);
    setCoordinates([]);
  };

  const finishDrawing = () => {
    console.log('Finishing drawing');
    if (coordinates.length > 2) {
      // Close the polygon by adding the first point again
      setCoordinates(prev => [...prev, prev[0]]);
    }
    setIsDrawing(false);
  };

  const clearGeofence = () => {
    console.log('Clearing geofence');
    setCoordinates([]);
    setIsDrawing(false);
  };

  const saveGeofence = () => {
    if (coordinates.length > 2) {
      console.log('Saving geofence coordinates:', coordinates);
      const formattedCoordinates = coordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude
      }));
      console.log('Formatted coordinates:', formattedCoordinates);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Geofencing</Text>
        <Text style={styles.subtitle}>
          {isDrawing ? 'Tap on map to draw boundary' : 'Press Start Drawing to begin'}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          mapType="standard"
        >
          {/* Show markers for each point while drawing */}
          {isDrawing && coordinates.map((coord, index) => (
            <Marker
              key={index}
              coordinate={coord}
              pinColor={Colors.light.tint}
              title={`Point ${index + 1}`}
            />
          ))}
          
          {/* Show polygon when we have enough points */}
          {coordinates.length >= 3 && (
            <Polygon
              coordinates={coordinates}
              strokeColor={Colors.light.tint}
              fillColor="rgba(10, 126, 164, 0.2)"
              strokeWidth={2}
            />
          )}
        </MapView>
      </View>

      <View style={styles.controls}>
        {!isDrawing ? (
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={startDrawing}
          >
            <Text style={styles.buttonText}>Start Drawing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={finishDrawing}
          >
            <Text style={styles.buttonText}>Finish Drawing</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={clearGeofence}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>

        {coordinates.length > 2 && !isDrawing && (
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={saveGeofence}
          >
            <Text style={styles.buttonText}>Save Geofence</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Points counter */}
      {isDrawing && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            Points: {coordinates.length} (Need at least 3)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'column',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  counter: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  counterText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GeofencingScreen; 