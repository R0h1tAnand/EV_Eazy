import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';

export default function RenterLayout() {
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
          title: 'Vehicle Details',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="(screens)/profile"
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      />
      <Stack.Screen
        name="(screens)/payments"
        options={{
          headerShown: true,
          title: 'Payments',
        }}
      />
      <Stack.Screen
        name="(screens)/scan-qr"
        options={{
          headerShown: true,
          title: 'Scan QR Code',
        }}
      />
      <Stack.Screen
        name="(screens)/ride-history"
        options={{
          headerShown: true,
          title: 'Ride History',
        }}
      />
      <Stack.Screen
        name="(screens)/support"
        options={{
          headerShown: true,
          title: 'Support',
        }}
      />
    </Stack>
  );
} 