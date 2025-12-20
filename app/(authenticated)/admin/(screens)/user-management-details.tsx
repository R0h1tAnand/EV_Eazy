import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UserManagementDetails() {
  const { userId } = useLocalSearchParams();

  // Mock data - in a real app, this would come from an API
  const userDetails = {
    id: userId || '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Customer',
    status: 'Active',
    joinDate: '2024-01-15',
    lastActive: '2024-03-15',
    totalRentals: 12,
    verificationStatus: 'Verified',
    contactInfo: {
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, Country',
    },
    rentalHistory: [
      { date: '2024-03-10', vehicle: 'Tesla Model 3', duration: '4 hours', status: 'Completed' },
      { date: '2024-03-05', vehicle: 'BMW i4', duration: '2 hours', status: 'Completed' },
      { date: '2024-02-28', vehicle: 'Tesla Model Y', duration: '6 hours', status: 'Completed' },
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{userDetails.name}</Text>
        <View style={[styles.statusBadge, 
          { backgroundColor: userDetails.status === 'Active' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{userDetails.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userDetails.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{userDetails.role}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Join Date</Text>
            <Text style={styles.infoValue}>{userDetails.joinDate}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Active</Text>
            <Text style={styles.infoValue}>{userDetails.lastActive}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.contactText}>{userDetails.contactInfo.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.contactText}>{userDetails.contactInfo.address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental History</Text>
        {userDetails.rentalHistory.map((rental, index) => (
          <View key={index} style={styles.rentalItem}>
            <View style={styles.rentalHeader}>
              <Text style={styles.rentalVehicle}>{rental.vehicle}</Text>
              <Text style={[styles.rentalStatus, 
                { color: rental.status === 'Completed' ? '#4CAF50' : '#FF9800' }]}>
                {rental.status}
              </Text>
            </View>
            <View style={styles.rentalDetails}>
              <Text style={styles.rentalDate}>{rental.date}</Text>
              <Text style={styles.rentalDuration}>{rental.duration}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.warningButton]}>
          <Ionicons name="ban-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Suspend User</Text>
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
  contactInfo: {
    gap: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
  },
  rentalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentalVehicle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  rentalStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rentalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  rentalDate: {
    fontSize: 12,
    color: '#666',
  },
  rentalDuration: {
    fontSize: 12,
    color: '#666',
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