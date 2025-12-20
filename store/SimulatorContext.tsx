import React, { createContext, useContext, useState, useEffect } from 'react';

// Types for simulation
export type Vehicle = {
  id: string;
  model: string;
  batteryPercentage: number;
  rentalCost: number;
  status: 'Available' | 'Rented' | 'Maintenance' | 'Charging';
  location: {
    latitude: number;
    longitude: number;
  };
  geofence?: {
    coordinates: Array<{latitude: number, longitude: number}>;
    active: boolean;
  };
};

export type DamageEvent = {
  id: string;
  vehicleId: string;
  timestamp: Date;
  severity: 'Minor' | 'Moderate' | 'Severe';
  description: string;
  penaltyAmount: number;
};

export type RentalSession = {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: Date;
  endTime?: Date;
  inProgress: boolean;
  cost: number;
  route: Array<{latitude: number, longitude: number, timestamp: Date}>;
  damageEvents: DamageEvent[];
  isOutsideGeofence: boolean;
  outsideGeofenceDuration: number;
};

type SimulatorContextType = {
  isSimulatorActive: boolean;
  toggleSimulator: () => void;
  vehicles: Vehicle[];
  rentalSessions: RentalSession[];
  activeSession: RentalSession | null;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  setGeofence: (vehicleId: string, coordinates: Array<{latitude: number, longitude: number}>) => void;
  startRental: (userId: string, vehicleId: string) => void;
  endRental: (sessionId: string) => string | undefined;
  triggerDamageEvent: (sessionId: string, severity: 'Minor' | 'Moderate' | 'Severe', description: string) => void;
  simulateMovement: (sessionId: string, newLocation: {latitude: number, longitude: number}) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  resetSimulator: () => void;
  assessDamage: (sessionId: string, damageConfidence: number) => number | undefined;
};

// Default context
const SimulatorContext = createContext<SimulatorContextType>({
  isSimulatorActive: false,
  toggleSimulator: () => {},
  vehicles: [],
  rentalSessions: [],
  activeSession: null,
  addVehicle: () => {},
  updateVehicle: () => {},
  setGeofence: () => {},
  startRental: () => {},
  endRental: () => undefined,
  triggerDamageEvent: () => {},
  simulateMovement: () => {},
  simulationSpeed: 1,
  setSimulationSpeed: () => {},
  resetSimulator: () => {},
  assessDamage: () => undefined,
});

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Check if a point is inside a polygon (for geofencing)
function isPointInPolygon(point: {latitude: number, longitude: number}, polygon: Array<{latitude: number, longitude: number}>): boolean {
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude, yi = polygon[i].latitude;
    const xj = polygon[j].longitude, yj = polygon[j].latitude;
    
    const intersect = ((yi > point.latitude) !== (yj > point.latitude)) &&
      (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Calculate distance between two points (in meters)
function calculateDistance(point1: {latitude: number, longitude: number}, point2: {latitude: number, longitude: number}): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export const SimulatorProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rentalSessions, setRentalSessions] = useState<RentalSession[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationTimers, setSimulationTimers] = useState<{[key: string]: NodeJS.Timeout}>({});

  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      Object.values(simulationTimers).forEach(timer => clearInterval(timer));
    };
  }, [simulationTimers]);

  const toggleSimulator = () => {
    setIsSimulatorActive(prev => !prev);
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: generateId(),
    };
    setVehicles(prev => [...prev, newVehicle]);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => 
      prev.map(vehicle => 
        vehicle.id === id ? { ...vehicle, ...updates } : vehicle
      )
    );
  };

  const setGeofence = (vehicleId: string, coordinates: Array<{latitude: number, longitude: number}>) => {
    setVehicles(prev => 
      prev.map(vehicle => 
        vehicle.id === vehicleId 
          ? { 
              ...vehicle, 
              geofence: { 
                coordinates,
                active: true
              } 
            } 
          : vehicle
      )
    );
  };

  const startRental = (userId: string, vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle || vehicle.status !== 'Available') {
      console.error('Vehicle not available for rental');
      return;
    }

    const newSession: RentalSession = {
      id: generateId(),
      userId,
      vehicleId,
      startTime: new Date(),
      inProgress: true,
      cost: 0,
      route: [
        {
          latitude: vehicle.location.latitude,
          longitude: vehicle.location.longitude,
          timestamp: new Date()
        }
      ],
      damageEvents: [],
      isOutsideGeofence: false,
      outsideGeofenceDuration: 0
    };

    // Update vehicle status
    updateVehicle(vehicleId, { status: 'Rented' });
    
    // Add new session
    setRentalSessions(prev => [...prev, newSession]);

    // Start the rental timer simulation
    const timerId = setInterval(() => {
      setRentalSessions(prev => 
        prev.map(session => {
          if (session.id === newSession.id && session.inProgress) {
            // Calculate rental duration in minutes
            const durationMs = Date.now() - session.startTime.getTime();
            const durationMinutes = durationMs / (1000 * 60);
            
            // Calculate cost (base rate per minute)
            const baseCostPerMinute = vehicle.rentalCost / 60;
            const newCost = baseCostPerMinute * durationMinutes;
            
            return {
              ...session,
              cost: Math.round(newCost * 100) / 100,
            };
          }
          return session;
        })
      );
    }, 1000 / simulationSpeed);

    // Store the timer reference
    setSimulationTimers(prev => ({
      ...prev,
      [`rental_${newSession.id}`]: timerId
    }));
  };

  const endRental = (sessionId: string) => {
    // Find the session
    const session = rentalSessions.find(s => s.id === sessionId);
    if (!session || !session.inProgress) {
      console.error('No active rental session found');
      return;
    }

    // Clear the timer
    if (simulationTimers[`rental_${sessionId}`]) {
      clearInterval(simulationTimers[`rental_${sessionId}`]);
      setSimulationTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[`rental_${sessionId}`];
        return newTimers;
      });
    }

    // Update the session
    setRentalSessions(prev => 
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            endTime: new Date(),
            inProgress: false
          };
        }
        return s;
      })
    );

    // Update vehicle status
    const vehicleId = session.vehicleId;
    updateVehicle(vehicleId, { status: 'Available' });
    
    return sessionId;
  };

  // New function to handle damage assessment after image upload
  const assessDamage = (sessionId: string, damageConfidence: number) => {
    const session = rentalSessions.find(s => s.id === sessionId && !s.inProgress);
    if (!session) {
      console.error('No completed rental session found');
      return;
    }

    // Calculate penalty based on confidence level
    const penaltyAmount = damageConfidence >= 80 ? 100 : 50;
    const severity = damageConfidence >= 80 ? 'Severe' : 'Moderate';

    const newDamageEvent: DamageEvent = {
      id: generateId(),
      vehicleId: session.vehicleId,
      timestamp: new Date(),
      severity,
      description: `Vehicle damage detected with ${damageConfidence.toFixed(1)}% confidence`,
      penaltyAmount
    };

    // Add damage event to session
    setRentalSessions(prev => 
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            damageEvents: [...s.damageEvents, newDamageEvent]
          };
        }
        return s;
      })
    );
    
    return penaltyAmount;
  };

  const triggerDamageEvent = (sessionId: string, severity: 'Minor' | 'Moderate' | 'Severe', description: string) => {
    const session = rentalSessions.find(s => s.id === sessionId);
    if (!session || !session.inProgress) {
      console.error('No active rental session found');
      return;
    }

    // Calculate penalty based on severity
    let penaltyAmount = 0;
    switch (severity) {
      case 'Minor':
        penaltyAmount = 20;
        break;
      case 'Moderate':
        penaltyAmount = 50;
        break;
      case 'Severe':
        penaltyAmount = 100;
        break;
    }

    const newDamageEvent: DamageEvent = {
      id: generateId(),
      vehicleId: session.vehicleId,
      timestamp: new Date(),
      severity,
      description,
      penaltyAmount
    };

    // Add damage event to session
    setRentalSessions(prev => 
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            damageEvents: [...s.damageEvents, newDamageEvent]
          };
        }
        return s;
      })
    );
  };

  const simulateMovement = (sessionId: string, newLocation: {latitude: number, longitude: number}) => {
    const session = rentalSessions.find(s => s.id === sessionId);
    if (!session || !session.inProgress) {
      console.error('No active rental session found');
      return;
    }

    const vehicle = vehicles.find(v => v.id === session.vehicleId);
    if (!vehicle) {
      console.error('Vehicle not found');
      return;
    }

    // Update vehicle location
    updateVehicle(vehicle.id, { location: newLocation });

    // Add to route history
    const newRoutePoint = {
      ...newLocation,
      timestamp: new Date()
    };

    // Check if outside geofence
    let isOutsideGeofence = false;
    if (vehicle.geofence?.active && vehicle.geofence.coordinates.length > 2) {
      isOutsideGeofence = !isPointInPolygon(newLocation, vehicle.geofence.coordinates);
    }

    setRentalSessions(prev => 
      prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            route: [...s.route, newRoutePoint],
            isOutsideGeofence,
            outsideGeofenceDuration: isOutsideGeofence 
              ? s.outsideGeofenceDuration + (1 / simulationSpeed)
              : s.outsideGeofenceDuration
          };
        }
        return s;
      })
    );

    // Check for sudden stops (potential damage events)
    if (session.route.length > 1) {
      const lastPoint = session.route[session.route.length - 1];
      const secondLastPoint = session.route[session.route.length - 2];
      
      // Calculate time difference in seconds
      const timeDiff = (newRoutePoint.timestamp.getTime() - lastPoint.timestamp.getTime()) / 1000;
      
      // Calculate distances
      const distLastToNew = calculateDistance(lastPoint, newLocation);
      const distSecondLastToLast = calculateDistance(secondLastPoint, lastPoint);
      
      // Calculate speeds (m/s)
      const currentSpeed = distLastToNew / timeDiff;
      const previousSpeed = distSecondLastToLast / timeDiff;
      
      // Calculate acceleration (negative means deceleration)
      const acceleration = (currentSpeed - previousSpeed) / timeDiff;
      
      // If there's a sudden deceleration (e.g., more than 5 m/s²), trigger a damage event
      if (acceleration < -5) {
        // Determine severity based on deceleration magnitude
        let severity: 'Minor' | 'Moderate' | 'Severe';
        if (acceleration < -15) {
          severity = 'Severe';
        } else if (acceleration < -10) {
          severity = 'Moderate';
        } else {
          severity = 'Minor';
        }
        
        triggerDamageEvent(
          sessionId, 
          severity, 
          `Sudden stop detected with deceleration of ${Math.abs(acceleration).toFixed(2)} m/s²`
        );
      }
    }
  };

  const resetSimulator = () => {
    // Clear all timers
    Object.values(simulationTimers).forEach(timer => clearInterval(timer));
    setSimulationTimers({});
    
    // Reset state
    setVehicles([]);
    setRentalSessions([]);
  };

  // Calculate active session
  const activeSession = rentalSessions.find(session => session.inProgress) || null;

  const value = {
    isSimulatorActive,
    toggleSimulator,
    vehicles,
    rentalSessions,
    activeSession,
    addVehicle,
    updateVehicle,
    setGeofence,
    startRental,
    endRental,
    triggerDamageEvent,
    simulateMovement,
    simulationSpeed,
    setSimulationSpeed,
    resetSimulator,
    assessDamage
  };

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => useContext(SimulatorContext); 