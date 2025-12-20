import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSimulator } from '../../store/SimulatorContext';
import Slider from '@react-native-community/slider';
import AdminVehicleControls from './AdminVehicleControls';
import UserRideControls from './UserRideControls';
import SimulationStats from './SimulationStats';

const SimulatorPanel: React.FC = () => {
  const { 
    isSimulatorActive, 
    toggleSimulator, 
    simulationSpeed, 
    setSimulationSpeed,
    resetSimulator 
  } = useSimulator();
  
  const [activeTab, setActiveTab] = useState<'admin' | 'user' | 'stats'>('admin');

  if (!isSimulatorActive) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isSimulatorActive}
      onRequestClose={toggleSimulator}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Simulator</Text>
            <TouchableOpacity onPress={toggleSimulator} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.speedControls}>
            <Text style={styles.speedLabel}>Simulation Speed: {simulationSpeed.toFixed(1)}x</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={5.0}
              step={0.1}
              value={simulationSpeed}
              onValueChange={setSimulationSpeed}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#000000"
              thumbTintColor="#4CAF50"
            />
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'admin' && styles.activeTab]} 
              onPress={() => setActiveTab('admin')}
            >
              <Text style={[styles.tabText, activeTab === 'admin' && styles.activeTabText]}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'user' && styles.activeTab]} 
              onPress={() => setActiveTab('user')}
            >
              <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>User</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'stats' && styles.activeTab]} 
              onPress={() => setActiveTab('stats')}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Stats</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {activeTab === 'admin' && <AdminVehicleControls />}
            {activeTab === 'user' && <UserRideControls />}
            {activeTab === 'stats' && <SimulationStats />}
          </ScrollView>

          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetSimulator}
          >
            <Text style={styles.resetButtonText}>Reset Simulator</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#333',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedControls: {
    marginBottom: 20,
  },
  speedLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#777',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  resetButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SimulatorPanel; 