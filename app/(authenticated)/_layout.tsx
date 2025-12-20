import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function AuthenticatedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="admin"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="renter"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 