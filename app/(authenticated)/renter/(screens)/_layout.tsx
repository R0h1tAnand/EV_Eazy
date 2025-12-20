import { Stack } from 'expo-router';

export default function RenterScreensLayout() {
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
          title: 'Renter Dashboard',
          headerLeft: () => null, // Remove back button from dashboard
        }}
      />
      <Stack.Screen
        name="vehicle-availability"
        options={{
          title: 'Available Vehicles',
        }}
      />
      <Stack.Screen
        name="payments"
        options={{
          title: 'Payments',
        }}
      />
      <Stack.Screen
        name="rental-history"
        options={{
          title: 'Rental History',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'My Profile',
        }}
      />
      <Stack.Screen
        name="vehicle-details"
        options={{
          title: 'Vehicle Details',
        }}
      />
      <Stack.Screen
        name="rental-verification"
        options={{
          title: 'Rental Verification',
          headerShown: false, // Hide the header as we have a custom header
        }}
      />
    </Stack>
  );
} 