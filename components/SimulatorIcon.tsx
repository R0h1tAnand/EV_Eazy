import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSimulator } from '../store/SimulatorContext';

interface SimulatorIconProps {
  size?: number;
  color?: string;
}

export const SimulatorIcon: React.FC<SimulatorIconProps> = ({ 
  size = 24, 
  color = '#ffffff' 
}) => {
  const { isSimulatorActive, toggleSimulator } = useSimulator();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSimulatorActive ? styles.active : {}
      ]}
      onPress={toggleSimulator}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={isSimulatorActive ? "game-controller" : "game-controller-outline"} 
          size={size} 
          color={color} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  active: {
    backgroundColor: '#4caf50',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SimulatorIcon; 