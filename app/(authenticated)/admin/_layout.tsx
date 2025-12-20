import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        // Hide the header for all screens by default
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="(screens)/dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(screens)/vehicle-details"
        options={{
          headerShown: true,
          title: 'Vehicle Management',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="(screens)/user-details"
        options={{
          headerShown: true,
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="(screens)/rental-details"
        options={{
          headerShown: true,
          title: 'Rental Overview',
        }}
      />
      <Stack.Screen
        name="(screens)/analytics-details"
        options={{
          headerShown: true,
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="(screens)/settings-details"
        options={{
          headerShown: true,
          title: 'System Settings',
        }}
      />
      <Stack.Screen
        name="(screens)/geofencing"
        options={{
          headerShown: true,
          title: 'Geofencing',
        }}
      />
    </Stack>
  );
} 