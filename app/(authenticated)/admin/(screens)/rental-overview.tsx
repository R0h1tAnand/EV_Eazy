import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RentalRecord } from '../../../../services/vehicleService';
import { getAllVehicles, getVehicleById } from '../../../../services/vehicleService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const RENTAL_HISTORY_KEY = 'rental_history';

export default function RentalOverview() {
  const [rentals, setRentals] = useState<RentalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const storedHistory = await AsyncStorage.getItem(RENTAL_HISTORY_KEY);
      const rentalHistory: RentalRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
      
      // Sort by start date, most recent first
      const sortedRentals = [...rentalHistory].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      
      setRentals(sortedRentals);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewRentalDetails = (rentalId: number) => {
    router.push({
      pathname: "/(authenticated)/admin/(screens)/rental-details",
      params: { rentalId: rentalId.toString() }
    });
  };

  const filteredRentals = activeFilter === 'All' 
    ? rentals 
    : rentals.filter(rental => rental.status === activeFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#4CAF50';
      case 'Completed': return '#2196F3';
      case 'Cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTotalRevenue = () => {
    return rentals
      .filter(rental => rental.status !== 'Cancelled')
      .reduce((total, rental) => total + rental.cost, 0);
  };

  const getActiveRentalsCount = () => {
    return rentals.filter(rental => rental.status === 'Active').length;
  };

  const getCompletedRentalsCount = () => {
    return rentals.filter(rental => rental.status === 'Completed').length;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rental Overview</Text>
        <Text style={styles.headerSubtitle}>
          {rentals.length} Total Rentals
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="car" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{getActiveRentalsCount()}</Text>
          <Text style={styles.statLabel}>Active Rentals</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{getCompletedRentalsCount()}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="cash" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>${getTotalRevenue()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'All' && styles.activeFilter]}
            onPress={() => setActiveFilter('All')}
          >
            <Text style={[styles.filterText, activeFilter === 'All' && styles.activeFilterText]}>
              All Rentals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'Active' && styles.activeFilter]}
            onPress={() => setActiveFilter('Active')}
          >
            <Text style={[styles.filterText, activeFilter === 'Active' && styles.activeFilterText]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'Completed' && styles.activeFilter]}
            onPress={() => setActiveFilter('Completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'Completed' && styles.activeFilterText]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'Cancelled' && styles.activeFilter]}
            onPress={() => setActiveFilter('Cancelled')}
          >
            <Text style={[styles.filterText, activeFilter === 'Cancelled' && styles.activeFilterText]}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Loading rentals...</Text>
          </View>
        ) : filteredRentals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No rentals found</Text>
            <Text style={styles.emptyStateSubtext}>
              {activeFilter !== 'All' 
                ? `No ${activeFilter.toLowerCase()} rentals available` 
                : 'Start by adding rental records'}
            </Text>
          </View>
        ) : (
          filteredRentals.map(rental => (
            <TouchableOpacity 
              key={rental.id} 
              style={styles.rentalCard}
              onPress={() => viewRentalDetails(rental.id)}
            >
              <View style={styles.rentalHeader}>
                <View>
                  <Text style={styles.rentalId}>Rental #{rental.id}</Text>
                  <Text style={styles.rentalDate}>{formatDate(rental.startDate)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rental.status) }]}>
                  <Text style={styles.statusText}>{rental.status}</Text>
                </View>
              </View>
              
              <View style={styles.rentalDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{rental.userName}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="car-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>Vehicle ID: {rental.vehicleId}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>${rental.cost}</Text>
                </View>
                
                {rental.pickupLocation && (
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{rental.pickupLocation}</Text>
                  </View>
                )}
                
                {rental.endDate && (
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>End: {formatDate(rental.endDate)}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.cardFooter}>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  filterContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#0066cc',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  rentalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rentalId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rentalDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  rentalDetails: {
    marginTop: 10,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 15,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
}); 