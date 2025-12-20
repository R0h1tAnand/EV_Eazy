import { Stack } from 'expo-router';

export default function AdminScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Admin Dashboard',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="vehicle-management"
        options={{
          title: 'Vehicle Management',
        }}
      />
      <Stack.Screen
        name="vehicle-management-details"
        options={{
          title: 'Vehicle Details',
        }}
      />
      <Stack.Screen
        name="user-management"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="user-management-details"
        options={{
          title: 'User Details',
        }}
      />
      <Stack.Screen
        name="rental-overview"
        options={{
          title: 'Rental Overview',
        }}
      />
      <Stack.Screen
        name="rental-details"
        options={{
          title: 'Rental Details',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="analytics-details"
        options={{
          title: 'Analytics Details',
        }}
      />
      <Stack.Screen
        name="system-settings"
        options={{
          title: 'System Settings',
        }}
      />
      <Stack.Screen
        name="settings-details"
        options={{
          title: 'Settings Details',
        }}
      />
      <Stack.Screen
        name="geofencing"
        options={{
          title: 'Geofencing',
        }}
      />
    </Stack>
  );
} 