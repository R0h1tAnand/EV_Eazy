import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RentalRecord } from '../../../../services/vehicleService';
import { getAllVehicles, Vehicle } from '../../../../services/vehicleService';

// Constants
const RENTAL_HISTORY_KEY = 'rental_history';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState<RentalRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [analyticsData, setAnalyticsData] = useState({
    totalRentals: 0,
    totalRevenue: 0,
    activeUsers: 0,
    dailyRentals: [0, 0, 0, 0, 0, 0, 0],
    popularLocations: [] as { name: string; percentage: number }[],
    vehicleUsage: [] as { model: string; rentals: number }[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get rental history
      const storedHistory = await AsyncStorage.getItem(RENTAL_HISTORY_KEY);
      const rentalHistory: RentalRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
      setRentals(rentalHistory);
      
      // Get vehicles
      const allVehicles = await getAllVehicles();
      setVehicles(allVehicles);
      
      // Process data for analytics
      processAnalyticsData(rentalHistory, allVehicles);
    } catch (error) {
      console.error('Error fetching data for analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (rentalHistory: RentalRecord[], vehicles: Vehicle[]) => {
    // Skip processing if there's no data
    if (rentalHistory.length === 0) {
      return;
    }
    
    // Total rentals and revenue
    const totalRentals = rentalHistory.length;
    const totalRevenue = rentalHistory
      .filter(rental => rental.status !== 'Cancelled')
      .reduce((sum, rental) => sum + rental.cost, 0);
      
    // Count unique users
    const uniqueUsers = new Set(rentalHistory.map(rental => rental.userId)).size;
    
    // Daily rentals for the last 7 days
    const last7Days = getLast7DaysData(rentalHistory);
    
    // Popular pickup locations
    const locationData = getPopularLocations(rentalHistory);
    
    // Vehicle usage statistics
    const vehicleUsageData = getVehicleUsage(rentalHistory, vehicles);
    
    // Update state with processed data
    setAnalyticsData({
      totalRentals,
      totalRevenue,
      activeUsers: uniqueUsers,
      dailyRentals: last7Days,
      popularLocations: locationData,
      vehicleUsage: vehicleUsageData,
    });
  };

  const getLast7DaysData = (rentalHistory: RentalRecord[]) => {
    const result = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      
      const startOfDay = new Date(targetDate);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const count = rentalHistory.filter(rental => {
        const rentalDate = new Date(rental.startDate);
        return rentalDate >= startOfDay && rentalDate <= endOfDay;
      }).length;
      
      // Store in reverse order (oldest to newest)
      result[6 - i] = count;
    }
    
    return result;
  };

  const getPopularLocations = (rentalHistory: RentalRecord[]) => {
    const locations: { [key: string]: number } = {};
    let totalWithLocation = 0;
    
    // Count rentals per location
    rentalHistory.forEach(rental => {
      if (rental.pickupLocation) {
        locations[rental.pickupLocation] = (locations[rental.pickupLocation] || 0) + 1;
        totalWithLocation++;
      }
    });
    
    // If no locations, return default
    if (totalWithLocation === 0) {
      return [
        { name: 'No Data', percentage: 100 }
      ];
    }
    
    // Convert to percentage and sort
    const result = Object.entries(locations).map(([name, count]) => ({
      name,
      percentage: Math.round((count / totalWithLocation) * 100)
    })).sort((a, b) => b.percentage - a.percentage);
    
    // Limit to top 5
    const top5 = result.slice(0, 5);
    
    // Add "Others" category if needed
    if (result.length > 5) {
      const othersPercentage = result.slice(5).reduce((sum, item) => sum + item.percentage, 0);
      top5.push({ name: 'Others', percentage: othersPercentage });
    }
    
    return top5;
  };

  const getVehicleUsage = (rentalHistory: RentalRecord[], vehicles: Vehicle[]) => {
    const usage: { [vehicleId: number]: number } = {};
    
    // Count rentals per vehicle
    rentalHistory.forEach(rental => {
      usage[rental.vehicleId] = (usage[rental.vehicleId] || 0) + 1;
    });
    
    // Map vehicle IDs to models and sort by usage
    return Object.entries(usage)
      .map(([vehicleId, rentals]) => {
        const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
        return {
          model: vehicle ? vehicle.model : `Vehicle ${vehicleId}`,
          rentals
        };
      })
      .sort((a, b) => b.rentals - a.rentals);
  };

  const getGrowthPercentage = () => {
    if (rentals.length === 0) return '+0.0%';
    
    // Compare current week with previous week
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const currentWeekRentals = rentals.filter(rental => 
      new Date(rental.startDate) >= oneWeekAgo && new Date(rental.startDate) <= today
    ).length;
    
    const previousWeekRentals = rentals.filter(rental => 
      new Date(rental.startDate) >= twoWeeksAgo && new Date(rental.startDate) < oneWeekAgo
    ).length;
    
    if (previousWeekRentals === 0) return currentWeekRentals > 0 ? '+100.0%' : '+0.0%';
    
    const growthRate = ((currentWeekRentals - previousWeekRentals) / previousWeekRentals) * 100;
    return (growthRate >= 0 ? '+' : '') + growthRate.toFixed(1) + '%';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>Last 7 Days Overview</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="car" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{analyticsData.totalRentals}</Text>
          <Text style={styles.statLabel}>Total Rentals</Text>
          <Text style={styles.statChange}>{getGrowthPercentage()}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="cash" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>${analyticsData.totalRevenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statChange}>{getGrowthPercentage()}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="people" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{analyticsData.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
          <Text style={styles.statChange}>{getGrowthPercentage()}</Text>
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Daily Rentals</Text>
        <View style={styles.barChart}>
          {analyticsData.dailyRentals.map((value, index) => {
            // Calculate day label
            const day = new Date();
            day.setDate(day.getDate() - (6 - index));
            const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short' });
            
            return (
              <View key={index} style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { height: value === 0 ? 5 : Math.max(20, Math.min(value * 20, 150)) }
                  ]} 
                />
                <Text style={styles.barLabel}>{dayLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Popular Locations</Text>
        <View style={styles.locationList}>
          {analyticsData.popularLocations.map((location, index) => (
            <View key={index} style={styles.locationItem}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationPercentage}>{location.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${location.percentage}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Vehicle Popularity</Text>
        <View style={styles.vehicleList}>
          {analyticsData.vehicleUsage.length === 0 ? (
            <Text style={styles.noDataText}>No rental data available</Text>
          ) : (
            analyticsData.vehicleUsage.map((vehicle, index) => (
              <View key={index} style={styles.vehicleItem}>
                <View style={styles.vehicleHeader}>
                  <Ionicons name="car-sport" size={20} color="#2196F3" />
                  <Text style={styles.vehicleName}>{vehicle.model}</Text>
                </View>
                <Text style={styles.vehicleRentals}>{vehicle.rentals} rentals</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        <View style={styles.insightCard}>
          <Ionicons name="trending-up" size={20} color="#4CAF50" />
          <Text style={styles.insightText}>
            {analyticsData.vehicleUsage.length > 0 
              ? `Most popular vehicle: ${analyticsData.vehicleUsage[0].model}`
              : 'No vehicle rental data available'}
          </Text>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="location" size={20} color="#FF9800" />
          <Text style={styles.insightText}>
            {analyticsData.popularLocations.length > 0 && analyticsData.popularLocations[0].name !== 'No Data'
              ? `Most popular pickup location: ${analyticsData.popularLocations[0].name}`
              : 'No location data available'}
          </Text>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="calendar" size={20} color="#2196F3" />
          <Text style={styles.insightText}>
            {Math.max(...analyticsData.dailyRentals) > 0
              ? `Peak rental day: ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][analyticsData.dailyRentals.indexOf(Math.max(...analyticsData.dailyRentals))]}`
              : 'No daily rental pattern detected yet'}
          </Text>
        </View>
      </View>
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
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statChange: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  chartSection: {
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
  },
  barChart: {
    height: 200,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 20,
    backgroundColor: '#2196F3',
    borderRadius: 10,
  },
  barLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  locationList: {
    gap: 15,
  },
  locationItem: {
    gap: 5,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationName: {
    fontSize: 14,
    color: '#333',
  },
  locationPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  vehicleList: {
    gap: 10,
  },
  vehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleName: {
    fontSize: 14,
    color: '#333',
  },
  vehicleRentals: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  insightsSection: {
    margin: 15,
    gap: 10,
  },
  insightCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
}); 