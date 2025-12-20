import AsyncStorage from '@react-native-async-storage/async-storage';

// Vehicle storage key in AsyncStorage
const VEHICLES_STORAGE_KEY = 'vehicles_data';
const RENTAL_HISTORY_KEY = 'rental_history';

export interface Vehicle {
  id: number;
  model: string;
  batteryPercentage: number;
  rentalCost: number;
  mileage: number;
  range: number;
  maxSpeed: number;
  seatingCapacity: number;
  status: 'Available' | 'Rented' | 'Maintenance';
  imageUrl?: string;
}

export interface RentalRecord {
  id: number;
  vehicleId: number;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string | null;
  status: 'Active' | 'Completed' | 'Cancelled';
  cost: number;
  destination?: string;
  purpose?: string;
  contactNumber?: string;
  pickupLocation?: string;
  aadharVerified?: boolean;
}

// Default vehicles data
const defaultVehicles: Vehicle[] = [
  {
    id: 1,
    model: 'O3',
    batteryPercentage: 85,
    rentalCost: 25,
    mileage: 120,
    range: 350,
    maxSpeed: 180,
    seatingCapacity: 5,
    status: 'Available',
  },
  {
    id: 2,
    model: 'GT5',
    batteryPercentage: 92,
    rentalCost: 30,
    mileage: 150,
    range: 400,
    maxSpeed: 200,
    seatingCapacity: 2,
    status: 'Available',
  },
];

const defaultRentalHistory: RentalRecord[] = [];

/**
 * Initialize the vehicles storage with default data if it doesn't exist
 */
export const initializeVehiclesData = async (): Promise<void> => {
  try {
    const storedVehicles = await AsyncStorage.getItem(VEHICLES_STORAGE_KEY);
    if (!storedVehicles) {
      await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(defaultVehicles));
      console.log('Initialized vehicles data with defaults');
    }

    const storedRentalHistory = await AsyncStorage.getItem(RENTAL_HISTORY_KEY);
    if (!storedRentalHistory) {
      await AsyncStorage.setItem(RENTAL_HISTORY_KEY, JSON.stringify(defaultRentalHistory));
      console.log('Initialized rental history data with defaults');
    }
  } catch (error) {
    console.error('Failed to initialize vehicles data:', error);
  }
};

/**
 * Get all vehicles
 */
export const getAllVehicles = async (): Promise<Vehicle[]> => {
  try {
    await initializeVehiclesData();
    const storedVehicles = await AsyncStorage.getItem(VEHICLES_STORAGE_KEY);
    return storedVehicles ? JSON.parse(storedVehicles) : [];
  } catch (error) {
    console.error('Error getting vehicles:', error);
    return [];
  }
};

/**
 * Get a specific vehicle by ID
 */
export const getVehicleById = async (id: number): Promise<Vehicle | null> => {
  try {
    console.log(`getVehicleById: Searching for vehicle with ID ${id}`);
    
    if (!id || isNaN(id) || id <= 0) {
      console.error(`getVehicleById: Invalid vehicle ID: ${id}`);
      return null;
    }
    
    const vehicles = await getAllVehicles();
    console.log(`getVehicleById: Found ${vehicles.length} vehicles total`);
    
    const vehicle = vehicles.find(vehicle => vehicle.id === id);
    
    if (vehicle) {
      console.log(`getVehicleById: Successfully found vehicle with ID ${id}: ${vehicle.model}`);
      return vehicle;
    } else {
      console.error(`getVehicleById: No vehicle found with ID ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting vehicle with ID ${id}:`, error);
    return null;
  }
};

/**
 * Add a new vehicle
 */
export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  try {
    const vehicles = await getAllVehicles();
    const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;
    
    const newVehicle: Vehicle = {
      ...vehicle,
      id: newId
    };
    
    const updatedVehicles = [...vehicles, newVehicle];
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
    
    return newVehicle;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw new Error('Failed to add vehicle');
  }
};

/**
 * Update an existing vehicle
 */
export const updateVehicle = async (updatedVehicle: Vehicle): Promise<Vehicle> => {
  try {
    const vehicles = await getAllVehicles();
    const index = vehicles.findIndex(v => v.id === updatedVehicle.id);
    
    if (index === -1) {
      throw new Error(`Vehicle with ID ${updatedVehicle.id} not found`);
    }
    
    vehicles[index] = updatedVehicle;
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
    
    return updatedVehicle;
  } catch (error) {
    console.error(`Error updating vehicle with ID ${updatedVehicle.id}:`, error);
    throw error;
  }
};

/**
 * Delete a vehicle
 */
export const deleteVehicle = async (id: number): Promise<boolean> => {
  try {
    const vehicles = await getAllVehicles();
    const filteredVehicles = vehicles.filter(v => v.id !== id);
    
    if (filteredVehicles.length === vehicles.length) {
      return false; // Vehicle with the given ID was not found
    }
    
    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(filteredVehicles));
    return true;
  } catch (error) {
    console.error(`Error deleting vehicle with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get rental history for a specific vehicle
 */
export const getVehicleRentalHistory = async (vehicleId: number): Promise<RentalRecord[]> => {
  try {
    const storedHistory = await AsyncStorage.getItem(RENTAL_HISTORY_KEY);
    const rentalHistory: RentalRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
    
    return rentalHistory.filter(record => record.vehicleId === vehicleId);
  } catch (error) {
    console.error(`Error getting rental history for vehicle ${vehicleId}:`, error);
    return [];
  }
};

/**
 * Add a new rental record
 */
export const addRentalRecord = async (record: Omit<RentalRecord, 'id'>): Promise<RentalRecord> => {
  try {
    const storedHistory = await AsyncStorage.getItem(RENTAL_HISTORY_KEY);
    const rentalHistory: RentalRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
    
    const newId = rentalHistory.length > 0 ? Math.max(...rentalHistory.map(r => r.id)) + 1 : 1;
    
    const newRecord: RentalRecord = {
      ...record,
      id: newId
    };
    
    const updatedHistory = [...rentalHistory, newRecord];
    await AsyncStorage.setItem(RENTAL_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    // Update the vehicle status to Rented
    const vehicle = await getVehicleById(record.vehicleId);
    if (vehicle) {
      await updateVehicle({
        ...vehicle,
        status: 'Rented'
      });
    }
    
    return newRecord;
  } catch (error) {
    console.error('Error adding rental record:', error);
    throw new Error('Failed to add rental record');
  }
};

/**
 * Update a rental record (e.g., when completing a rental)
 */
export const updateRentalRecord = async (updatedRecord: RentalRecord): Promise<RentalRecord> => {
  try {
    const storedHistory = await AsyncStorage.getItem(RENTAL_HISTORY_KEY);
    const rentalHistory: RentalRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
    
    const index = rentalHistory.findIndex(r => r.id === updatedRecord.id);
    
    if (index === -1) {
      throw new Error(`Rental record with ID ${updatedRecord.id} not found`);
    }
    
    rentalHistory[index] = updatedRecord;
    await AsyncStorage.setItem(RENTAL_HISTORY_KEY, JSON.stringify(rentalHistory));
    
    // If the rental status is set to Completed, update the vehicle status to Available
    if (updatedRecord.status === 'Completed') {
      const vehicle = await getVehicleById(updatedRecord.vehicleId);
      if (vehicle) {
        await updateVehicle({
          ...vehicle,
          status: 'Available'
        });
      }
    }
    
    return updatedRecord;
  } catch (error) {
    console.error(`Error updating rental record with ID ${updatedRecord.id}:`, error);
    throw error;
  }
}; 