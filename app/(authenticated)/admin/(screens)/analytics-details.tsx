import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsDetails() {
  const { metricType } = useLocalSearchParams();

  // Mock data - in a real app, this would come from an API
  const analyticsData = {
    type: metricType || 'revenue',
    summary: {
      currentValue: '$45,678',
      previousValue: '$42,345',
      percentageChange: '+7.8%',
      trend: 'up',
      period: 'Last 30 days'
    },
    metrics: [
      { label: 'Total Revenue', value: '$45,678', change: '+7.8%', trend: 'up' },
      { label: 'Active Rentals', value: '124', change: '+12.5%', trend: 'up' },
      { label: 'Average Duration', value: '3.5 hrs', change: '-2.1%', trend: 'down' },
      { label: 'Customer Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' }
    ],
    topPerformers: {
      vehicles: [
        { name: 'Tesla Model 3', revenue: '$12,450', rentals: 45 },
        { name: 'BMW i4', revenue: '$10,230', rentals: 38 },
        { name: 'Tesla Model Y', revenue: '$9,870', rentals: 35 }
      ],
      locations: [
        { name: 'Downtown Station', revenue: '$15,670', rentals: 58 },
        { name: 'Airport Terminal', revenue: '$12,340', rentals: 45 },
        { name: 'Shopping Mall', revenue: '$8,900', rentals: 32 }
      ]
    },
    hourlyDistribution: [
      { hour: '6-9 AM', percentage: 15 },
      { hour: '9-12 PM', percentage: 25 },
      { hour: '12-3 PM', percentage: 20 },
      { hour: '3-6 PM', percentage: 30 },
      { hour: '6-9 PM', percentage: 10 }
    ],
    recentActivity: [
      { time: '2 hours ago', event: 'New rental started', value: '$45' },
      { time: '3 hours ago', event: 'Rental completed', value: '$120' },
      { time: '4 hours ago', event: 'New rental started', value: '$75' },
      { time: '5 hours ago', event: 'Rental completed', value: '$90' }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>{analyticsData.summary.period}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Total Revenue</Text>
          <View style={[styles.trendBadge, 
            { backgroundColor: analyticsData.summary.trend === 'up' ? '#4CAF50' : '#FF9800' }]}>
            <Ionicons 
              name={analyticsData.summary.trend === 'up' ? 'trending-up' : 'trending-down'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.trendText}>{analyticsData.summary.percentageChange}</Text>
          </View>
        </View>
        <Text style={styles.summaryValue}>{analyticsData.summary.currentValue}</Text>
        <Text style={styles.summaryPrevious}>
          Previous: {analyticsData.summary.previousValue}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        {analyticsData.metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <View style={[styles.metricTrend, 
              { backgroundColor: metric.trend === 'up' ? '#4CAF50' : '#FF9800' }]}>
              <Ionicons 
                name={metric.trend === 'up' ? 'trending-up' : 'trending-down'} 
                size={12} 
                color="#fff" 
              />
              <Text style={styles.metricChange}>{metric.change}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Vehicles</Text>
        {analyticsData.topPerformers.vehicles.map((vehicle, index) => (
          <View key={index} style={styles.performerItem}>
            <View style={styles.performerInfo}>
              <Text style={styles.performerName}>{vehicle.name}</Text>
              <Text style={styles.performerStats}>
                {vehicle.rentals} rentals
              </Text>
            </View>
            <Text style={styles.performerRevenue}>{vehicle.revenue}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Locations</Text>
        {analyticsData.topPerformers.locations.map((location, index) => (
          <View key={index} style={styles.performerItem}>
            <View style={styles.performerInfo}>
              <Text style={styles.performerName}>{location.name}</Text>
              <Text style={styles.performerStats}>
                {location.rentals} rentals
              </Text>
            </View>
            <Text style={styles.performerRevenue}>{location.revenue}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hourly Distribution</Text>
        <View style={styles.distributionChart}>
          {analyticsData.hourlyDistribution.map((slot, index) => (
            <View key={index} style={styles.distributionBar}>
              <View 
                style={[styles.distributionFill, { height: `${slot.percentage}%` }]} 
              />
              <Text style={styles.distributionLabel}>{slot.hour}</Text>
              <Text style={styles.distributionValue}>{slot.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {analyticsData.recentActivity.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityEvent}>{activity.event}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            <Text style={styles.activityValue}>{activity.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Export Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Share Insights</Text>
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
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    gap: 4,
  },
  trendText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  summaryPrevious: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 7.5,
    gap: 15,
  },
  metricCard: {
    backgroundColor: '#fff',
    width: '45%',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 5,
    gap: 4,
  },
  metricChange: {
    color: '#fff',
    fontSize: 12,
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
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  performerStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  performerRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  distributionChart: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  distributionBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  distributionFill: {
    width: 20,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    marginBottom: 10,
  },
  distributionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  distributionValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activityInfo: {
    flex: 1,
  },
  activityEvent: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 