import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSimulator } from '../../store/SimulatorContext';
import { Ionicons } from '@expo/vector-icons';

const SimulationStats: React.FC = () => {
  const { vehicles, rentalSessions } = useSimulator();
  
  // Calculate statistics
  const activeVehicles = vehicles.filter(v => v.status === 'Available').length;
  const rentedVehicles = vehicles.filter(v => v.status === 'Rented').length;
  
  const completedRentals = rentalSessions.filter(s => !s.inProgress).length;
  const activeRentals = rentalSessions.filter(s => s.inProgress).length;
  
  const totalRevenue = rentalSessions.reduce((sum, session) => {
    return sum + session.cost;
  }, 0);
  
  const totalPenalties = rentalSessions.reduce((sum, session) => {
    return sum + session.damageEvents.reduce((damageSum, event) => damageSum + event.penaltyAmount, 0);
  }, 0);
  
  const totalGeofenceViolations = rentalSessions.reduce((sum, session) => {
    return sum + (session.isOutsideGeofence || session.outsideGeofenceDuration > 0 ? 1 : 0);
  }, 0);
  
  const avgRentalDuration = completedRentals > 0 
    ? rentalSessions
        .filter(s => !s.inProgress && s.endTime)
        .reduce((sum, session) => {
          const durationMs = session.endTime!.getTime() - session.startTime.getTime();
          return sum + (durationMs / (1000 * 60)); // Convert to minutes
        }, 0) / completedRentals
    : 0;
  
  const damageEvents = rentalSessions.reduce((sum, session) => {
    return sum + session.damageEvents.length;
  }, 0);
  
  const vehicleUtilization = vehicles.length > 0
    ? (rentedVehicles / vehicles.length) * 100
    : 0;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Simulation Overview</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="car" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Total Vehicles</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{activeVehicles}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F44336' }]}>
            <Ionicons name="time" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{rentedVehicles}</Text>
          <Text style={styles.statLabel}>In Use</Text>
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Rental Activity</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#9C27B0' }]}>
            <Ionicons name="bicycle" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{completedRentals}</Text>
          <Text style={styles.statLabel}>Completed Rides</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="pulse" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{activeRentals}</Text>
          <Text style={styles.statLabel}>Active Rides</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#3F51B5' }]}>
            <Ionicons name="time" size={24} color="#fff" />
          </View>
          <Text style={styles.statValue}>{avgRentalDuration.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg. Duration (min)</Text>
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Financial Stats</Text>
      
      <View style={styles.financeStats}>
        <View style={styles.financeItem}>
          <Text style={styles.financeLabel}>Total Revenue</Text>
          <Text style={styles.financeValue}>${totalRevenue.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.financeItem}>
          <Text style={styles.financeLabel}>Penalty Revenue</Text>
          <Text style={styles.financeValue}>${totalPenalties.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.financeItem}>
          <Text style={styles.financeLabel}>Vehicle Utilization</Text>
          <Text style={styles.financeValue}>{vehicleUtilization.toFixed(1)}%</Text>
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Incident Statistics</Text>
      
      <View style={styles.incidentStats}>
        <View style={styles.incidentItem}>
          <View style={styles.incidentIcon}>
            <Ionicons name="warning" size={24} color="#FF9800" />
          </View>
          <View style={styles.incidentInfo}>
            <Text style={styles.incidentValue}>{damageEvents}</Text>
            <Text style={styles.incidentLabel}>Damage Events</Text>
          </View>
        </View>
        
        <View style={styles.incidentItem}>
          <View style={styles.incidentIcon}>
            <Ionicons name="compass" size={24} color="#F44336" />
          </View>
          <View style={styles.incidentInfo}>
            <Text style={styles.incidentValue}>{totalGeofenceViolations}</Text>
            <Text style={styles.incidentLabel}>Geofence Violations</Text>
          </View>
        </View>
      </View>
      
      {rentalSessions.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Activity</Text>
          
          <View style={styles.activityList}>
            {rentalSessions.slice(0, 5).map((session) => (
              <View key={session.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={session.inProgress ? "play-circle" : "checkmark-circle"} 
                    size={24} 
                    color={session.inProgress ? "#4CAF50" : "#2196F3"} 
                  />
                </View>
                
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>
                    {session.inProgress ? "Ongoing Rental" : "Completed Rental"}
                  </Text>
                  <Text style={styles.activityDetail}>
                    Vehicle: {vehicles.find(v => v.id === session.vehicleId)?.model || 'Unknown'}
                  </Text>
                  <Text style={styles.activityDetail}>
                    Started: {session.startTime.toLocaleTimeString()}
                  </Text>
                  {session.endTime && (
                    <Text style={styles.activityDetail}>
                      Ended: {session.endTime.toLocaleTimeString()}
                    </Text>
                  )}
                  {session.damageEvents.length > 0 && (
                    <Text style={[styles.activityDetail, styles.warningText]}>
                      Damage Events: {session.damageEvents.length}
                    </Text>
                  )}
                </View>
                
                <View style={styles.activityStatus}>
                  <Text style={[
                    styles.activityCost,
                    session.inProgress ? styles.pendingText : styles.completedText
                  ]}>
                    ${session.cost.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
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
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  financeStats: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
  },
  financeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  financeLabel: {
    fontSize: 16,
    color: '#555',
  },
  financeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 5,
  },
  incidentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incidentItem: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  incidentIcon: {
    marginRight: 10,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  incidentLabel: {
    fontSize: 14,
    color: '#555',
  },
  activityList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 5,
  },
  activityItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  activityIcon: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  activityDetail: {
    fontSize: 14,
    color: '#555',
  },
  activityStatus: {
    justifyContent: 'center',
    paddingRight: 5,
  },
  activityCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#FF9800',
  },
  completedText: {
    color: '#4CAF50',
  },
  warningText: {
    color: '#F44336',
  },
});

export default SimulationStats; 