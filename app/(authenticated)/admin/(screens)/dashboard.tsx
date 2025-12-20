import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isLoggedIn, getActiveUserEmail, getUserData, UserData, loginWithEmail } from '../../../../services/authService';
import { authStore } from '../../../../utils/auth';
import { authFix } from '../../../../utils/authFix';
import { supabase } from '../../../../utils/supabase';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Check login status and get current user
  useEffect(() => {
    let isMounted = true;
    let navigationAttempted = false;

    const checkLoginAndLoadUser = async () => {
      try {
        // Add a small delay to prevent excessive checks
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check both auth systems to ensure we're truly logged in
        const serviceLoggedIn = await isLoggedIn();
        const { isValid, role } = await authStore.validateUser();
        
        if (!isMounted) return;
        
        // If either auth system shows we're not logged in, go to login
        if ((!serviceLoggedIn || !isValid) && !navigationAttempted) {
          // Prevent multiple navigation attempts
          navigationAttempted = true;
          console.log('Not logged in or auth validation failed, redirecting to login screen');
          
          // Try to clear auth data before redirecting
          try {
            await authFix.signOutAndClearSession();
          } catch (err) {
            console.error('Failed to clear auth data:', err);
          }
          
          // Add a longer delay before navigation to prevent loops
          setTimeout(() => {
            if (isMounted) {
              router.replace('/(auth)/login');
            }
          }, 1000);
          return;
        }
        
        // Check if user has correct role
        if (isValid && role !== 'admin') {
          console.log(`User has incorrect role (${role}), redirecting to correct dashboard`);
          if (!navigationAttempted) {
            navigationAttempted = true;
            setTimeout(() => {
              if (isMounted) {
                // Only navigate to valid roles
                if (role === 'renter') {
                  router.replace('/(authenticated)/renter/(screens)/dashboard');
                } else {
                  // If role is invalid, go to login
                  console.log('Invalid role detected, clearing auth data and redirecting to login');
                  authFix.clearAllAuthData().then(() => {
                    router.replace('/(auth)/login');
                  });
                }
              }
            }, 1000);
          }
          return;
        }
        
        // Get user data from both systems and merge if needed
        let email = await getActiveUserEmail();
        if (!email && isValid) {
          // If authService doesn't have email but Supabase does, get it from Supabase
          const { data } = await supabase.auth.getUser();
          email = data.user?.email || null;
          
          // Synchronize with authService
          if (email) {
            console.log('Syncing email to authService:', email);
            const name = data.user?.user_metadata?.name || 'User';
            await loginWithEmail(email, name);
          }
        }
        
        if (email && isMounted) {
          const user = await getUserData(email);
          
          // Verify the user is an admin
          if (user && user.role === 'admin') {
            if (isMounted) {
              setUserData(user);
              setIsLoading(false);
            }
          } else {
            // User is not an admin, redirect to the appropriate dashboard
            console.log('User is not an admin, redirecting');
            if (!navigationAttempted && isMounted) {
              navigationAttempted = true;
              setTimeout(() => {
                if (isMounted) {
                  router.replace('/(authenticated)/renter/(screens)/dashboard');
                }
              }, 1000);
              return;
            }
          }
        } else {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        // If there's an error, try clearing auth data and redirecting
        if (!navigationAttempted) {
          navigationAttempted = true;
          try {
            await authFix.clearAllAuthData();
          } catch (err) {
            console.error('Failed to clear auth data:', err);
          }
          setTimeout(() => {
            if (isMounted) {
              router.replace('/(auth)/login');
            }
          }, 1000);
        } else if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkLoginAndLoadUser();
    
    return () => { 
      isMounted = false;
    };
  }, []);
  
  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const menuItems = [
    {
      title: 'Vehicle Management',
      icon: 'car-sport',
      route: '/(authenticated)/admin/(screens)/vehicle-management',
      detailRoute: '/(authenticated)/admin/(screens)/vehicle-management-details',
      description: 'Manage EV fleet and availability',
      stats: '12 Active',
      color: '#4CAF50'
    },
    {
      title: 'User Management',
      icon: 'people',
      route: '/(authenticated)/admin/(screens)/user-management',
      detailRoute: '/(authenticated)/admin/(screens)/user-management-details',
      description: 'Manage user accounts and roles',
      stats: '156 Users',
      color: '#2196F3'
    },
    {
      title: 'Rental Overview',
      icon: 'calendar',
      route: '/(authenticated)/admin/(screens)/rental-overview',
      detailRoute: '/(authenticated)/admin/(screens)/rental-details',
      description: 'Track rentals and returns',
      stats: '8 Active',
      color: '#FF9800'
    },
    {
      title: 'Analytics',
      icon: 'bar-chart',
      route: '/(authenticated)/admin/(screens)/analytics',
      detailRoute: '/(authenticated)/admin/(screens)/analytics-details',
      description: 'View insights and reports',
      stats: 'Real-time',
      color: '#9C27B0'
    },
    {
      title: 'System Settings',
      icon: 'settings',
      route: '/(authenticated)/admin/(screens)/system-settings',
      detailRoute: '/(authenticated)/admin/(screens)/settings-details',
      description: 'Configure system parameters',
      stats: '3 Updates',
      color: '#607D8B'
    },
    {
      title: 'Geofencing',
      icon: 'map',
      route: '/(authenticated)/admin/(screens)/geofencing',
      detailRoute: '/(authenticated)/admin/(screens)/geofencing',
      description: 'Manage vehicle boundaries',
      stats: '5 Zones',
      color: '#E91E63'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back, {userData?.name || 'Admin'}!</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
        <TouchableOpacity 
          onPress={async () => {
            try {
              await authStore.signOut();
            } catch (error) {
              console.error("Logout error:", error);
            }
          }}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(authenticated)/admin/(screens)/vehicle-management' as any)}
        >
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Active EVs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(authenticated)/admin/(screens)/user-management' as any)}
        >
          <Text style={styles.statNumber}>156</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(authenticated)/admin/(screens)/rental-overview' as any)}
        >
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Active Rentals</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <View key={index} style={styles.menuItemContainer}>
            <TouchableOpacity
              style={[styles.menuItem, { borderLeftColor: item.color }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuContent}>
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={24} color="#fff" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
                <Text style={[styles.menuStats, { color: item.color }]}>{item.stats}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewDetailsButton, { backgroundColor: item.color }]}
              onPress={() => router.push(item.detailRoute as any)}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(authenticated)/admin/(screens)/vehicle-management' as any)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add New Vehicle</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => router.push('/(authenticated)/admin/(screens)/user-management' as any)}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add New User</Text>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4511e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  menuGrid: {
    padding: 15,
    gap: 15,
  },
  menuItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    borderLeftWidth: 5,
  },
  menuContent: {
    padding: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  menuStats: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    gap: 5,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActions: {
    padding: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
}); 