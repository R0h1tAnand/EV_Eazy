import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserData } from '../../../../services/authService';
import { supabase } from '../../../lib/supabase';
import { router } from 'expo-router';

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    fetchUsers();
  }, []);

  const checkConnection = async () => {
    try {
      setConnectionError(null);
      // Simple query to test connection
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Database connection error:', error);
        setConnectionError('Unable to connect to database. Please check your network connection.');
        Alert.alert(
          'Connection Error',
          'Could not connect to the database. Some features may not work correctly.',
          [
            { text: 'Try Again', onPress: checkConnection },
            { text: 'OK' }
          ]
        );
      } else {
        console.log('Database connection successful');
      }
    } catch (error) {
      console.error('Unexpected error checking connection:', error);
      setConnectionError('An unexpected error occurred while connecting to database.');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from Supabase...');
      
      // Get all users with no filters to ensure all records are retrieved
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_login', { ascending: false });

      if (error) {
        console.error('Error fetching users from Supabase:', error);
        return;
      }

      console.log(`Retrieved ${data?.length || 0} users from database`);
      
      if (!data || data.length === 0) {
        console.log('No users found in database');
        setUsers([]);
        return;
      }

      // Transform the data to match UserData interface
      const transformedData = data.map(user => {
        console.log('Processing user:', user.email);
        return {
          email: user.email,
          name: user.name || 'Unknown User',
          photoUrl: user.photo_url,
          lastLogin: new Date(user.last_login || Date.now()),
          role: user.role as 'admin' | 'renter'
        };
      });

      console.log('Setting users state with transformed data');
      setUsers(transformedData);
    } catch (error) {
      console.error('Unexpected error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesQuery = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === null || user.role === filterRole;
    
    return matchesQuery && matchesRole;
  });

  const viewUserDetails = (email: string) => {
    router.push({
      pathname: "/(authenticated)/admin/(screens)/user-management-details",
      params: { email }
    });
  };

  const renderUserCard = (user: UserData) => (
    <TouchableOpacity 
      style={styles.userCard} 
      key={user.email}
      onPress={() => viewUserDetails(user.email)}
    >
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          {user.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.noAvatar]}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Last Login: {user.lastLogin.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Role: {user.role === 'admin' ? 'Administrator' : 'Renter'}
          </Text>
        </View>
      </View>
      
      <View style={styles.badgeContainer}>
        <View style={[
          styles.badge, 
          user.role === 'admin' ? styles.adminBadge : styles.renterBadge
        ]}>
          <Text style={styles.badgeText}>
            {user.role === 'admin' ? 'Admin' : 'Renter'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>User Management</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => {
              checkConnection();
              fetchUsers();
            }}
          >
            <Ionicons name="refresh" size={22} color="#0066cc" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {users.length} Registered Users
        </Text>
      </View>

      {connectionError && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={18} color="#F44336" />
          <Text style={styles.errorText}>{connectionError}</Text>
        </View>
      )}

      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.roleFilters}>
          <TouchableOpacity 
            style={[styles.filterButton, filterRole === null && styles.activeFilter]}
            onPress={() => setFilterRole(null)}
          >
            <Text style={[styles.filterText, filterRole === null && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterRole === 'admin' && styles.activeFilter]}
            onPress={() => setFilterRole('admin')}
          >
            <Text style={[styles.filterText, filterRole === 'admin' && styles.activeFilterText]}>
              Admins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterRole === 'renter' && styles.activeFilter]}
            onPress={() => setFilterRole('renter')}
          >
            <Text style={[styles.filterText, filterRole === 'renter' && styles.activeFilterText]}>
              Renters
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No users found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search query' : 'Add users to get started'}
            </Text>
          </View>
        ) : (
          filteredUsers.map(renderUserCard)
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  roleFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  noAvatar: {
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  badgeContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#4CAF50',
  },
  renterBadge: {
    backgroundColor: '#2196F3',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 5,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 15,
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    flex: 1,
    fontSize: 14,
  },
}); 