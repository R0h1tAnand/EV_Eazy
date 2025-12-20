import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RentalDetails() {
  const { rentalId } = useLocalSearchParams();

  // Mock data - in a real app, this would come from an API
  const rentalDetails = {
    id: rentalId || '1',
    status: 'Active',
    startTime: '2024-03-15 14:30',
    endTime: '2024-03-15 18:30',
    duration: '4 hours',
    cost: '$120.00',
    vehicle: {
      name: 'Tesla Model 3',
      licensePlate: 'EV-2024',
      batteryLevel: '85%',
      currentLocation: 'Downtown Station'
    },
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567'
    },
    payment: {
      method: 'Credit Card',
      status: 'Paid',
      transactionId: 'TXN-123456',
      amount: '$120.00'
    },
    route: {
      pickup: 'Downtown Station',
      dropoff: 'Airport Terminal 1',
      distance: '15.5 km'
    },
    timeline: [
      { time: '14:25', event: 'Rental Initiated', status: 'Completed' },
      { time: '14:30', event: 'Vehicle Unlocked', status: 'Completed' },
      { time: '14:35', event: 'Journey Started', status: 'Completed' },
      { time: '18:25', event: 'Journey Completed', status: 'Completed' },
      { time: '18:30', event: 'Vehicle Locked', status: 'Completed' }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rental #{rentalDetails.id}</Text>
        <View style={[styles.statusBadge, 
          { backgroundColor: rentalDetails.status === 'Active' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{rentalDetails.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Start Time</Text>
            <Text style={styles.infoValue}>{rentalDetails.startTime}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>End Time</Text>
            <Text style={styles.infoValue}>{rentalDetails.endTime}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{rentalDetails.duration}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cost</Text>
            <Text style={styles.infoValue}>{rentalDetails.cost}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>{rentalDetails.vehicle.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>License Plate</Text>
            <Text style={styles.infoValue}>{rentalDetails.vehicle.licensePlate}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Battery Level</Text>
            <Text style={styles.infoValue}>{rentalDetails.vehicle.batteryLevel}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Current Location</Text>
            <Text style={styles.infoValue}>{rentalDetails.vehicle.currentLocation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Ionicons name="person-circle-outline" size={40} color="#666" />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{rentalDetails.user.name}</Text>
              <Text style={styles.userEmail}>{rentalDetails.user.email}</Text>
            </View>
          </View>
          <Text style={styles.userPhone}>{rentalDetails.user.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentMethod}>
              <Ionicons name="card-outline" size={24} color="#666" />
              <Text style={styles.paymentMethodText}>{rentalDetails.payment.method}</Text>
            </View>
            <Text style={[styles.paymentStatus, 
              { color: rentalDetails.payment.status === 'Paid' ? '#4CAF50' : '#FF9800' }]}>
              {rentalDetails.payment.status}
            </Text>
          </View>
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentLabel}>Transaction ID</Text>
            <Text style={styles.paymentValue}>{rentalDetails.payment.transactionId}</Text>
          </View>
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentLabel}>Amount</Text>
            <Text style={styles.paymentValue}>{rentalDetails.payment.amount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Information</Text>
        <View style={styles.routeInfo}>
          <View style={styles.routePoint}>
            <Ionicons name="location" size={24} color="#4CAF50" />
            <View style={styles.routePointDetails}>
              <Text style={styles.routePointLabel}>Pickup Location</Text>
              <Text style={styles.routePointValue}>{rentalDetails.route.pickup}</Text>
            </View>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routePoint}>
            <Ionicons name="location" size={24} color="#FF9800" />
            <View style={styles.routePointDetails}>
              <Text style={styles.routePointLabel}>Dropoff Location</Text>
              <Text style={styles.routePointValue}>{rentalDetails.route.dropoff}</Text>
            </View>
          </View>
          <Text style={styles.routeDistance}>Total Distance: {rentalDetails.route.distance}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Timeline</Text>
        <View style={styles.timeline}>
          {rentalDetails.timeline.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelinePoint}>
                <View style={[styles.timelineDot, 
                  { backgroundColor: event.status === 'Completed' ? '#4CAF50' : '#FF9800' }]} />
                {index < rentalDetails.timeline.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>{event.time}</Text>
                <Text style={styles.timelineEvent}>{event.event}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Generate Invoice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.warningButton]}>
          <Ionicons name="close-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>End Rental</Text>
        </TouchableOpacity>
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
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
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
  infoGrid: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    gap: 15,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  paymentInfo: {
    gap: 15,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#333',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  routeInfo: {
    gap: 15,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routePointDetails: {
    flex: 1,
  },
  routePointLabel: {
    fontSize: 12,
    color: '#666',
  },
  routePointValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDivider: {
    height: 20,
    width: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 12,
  },
  routeDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  timeline: {
    gap: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 15,
  },
  timelinePoint: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineEvent: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 