import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { getUserBalance, addUserBalance } from '../../../../services/databaseService';
import { getActiveUserEmail, isLoggedIn } from '../../../../services/authService';

// Predefined amount options
const amountOptions = [100, 200, 500, 1000];

// Replace the image icon imports with Ionicon components
const PaymentMethodIcon = ({ 
  type, 
  size = 40, 
  color = Colors.light.text 
}: { 
  type: string; 
  size?: number; 
  color?: string;
}) => {
  let iconName = 'card-outline';
  
  switch (type) {
    case 'google-pay':
      iconName = 'logo-google';
      color = '#4285F4';
      break;
    case 'phone-pay':
      iconName = 'phone-portrait-outline';
      color = '#5f259f';
      break;
    case 'paytm':
      iconName = 'wallet-outline';
      color = '#00BAF2';
      break;
    case 'credit-card':
      iconName = 'card-outline';
      color = '#3c3c3c';
      break;
    case 'upi':
      iconName = 'cash-outline';
      color = '#4CAF50';
      break;
  }
  
  return (
    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
      <Ionicons name={iconName as any} size={size * 0.6} color={color} />
    </View>
  );
};

export default function PaymentsScreen() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkLoginAndLoadUser = async () => {
      const loggedIn = await isLoggedIn();
      
      if (!loggedIn) {
        // Redirect to login if not logged in
        router.replace('/(auth)/login');
        return;
      }
      
      const email = await getActiveUserEmail();
      if (email) {
        setUserEmail(email);
      }
    };
    
    checkLoginAndLoadUser();
  }, []);
  
  // Load current balance from database
  useEffect(() => {
    if (!userEmail) return;
    
    const loadUserBalance = async () => {
      try {
        const balance = await getUserBalance(userEmail);
        setCurrentBalance(balance);
      } catch (error: any) {
        console.error('Failed to load user balance:', error);
      }
    };
    
    loadUserBalance();
  }, [userEmail]);

  // Remove the requires for icons and update the payment methods
  const paymentMethods = [
    {
      id: 'google-pay',
      name: 'Google Pay',
      iconType: 'google-pay',
    },
    {
      id: 'phone-pay',
      name: 'PhonePe',
      iconType: 'phone-pay',
    },
    {
      id: 'paytm',
      name: 'Paytm',
      iconType: 'paytm',
    },
    {
      id: 'credit-card',
      name: 'Credit/Debit Card',
      iconType: 'credit-card',
    },
    {
      id: 'upi',
      name: 'UPI',
      iconType: 'upi',
    },
  ];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    setSelectedAmount(null);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const getFinalAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseInt(customAmount, 10);
    return 0;
  };

  const isValidPayment = () => {
    const amount = getFinalAmount();
    return amount > 0 && selectedPaymentMethod !== null;
  };

  const processPayment = () => {
    if (!userEmail) {
      Alert.alert(
        'Authentication Error',
        'Please log in to proceed with the payment.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!isValidPayment()) {
      Alert.alert('Error', 'Please select an amount and payment method');
      return;
    }

    setIsProcessing(true);
    const amount = getFinalAmount();

    // Process payment through database service
    addUserBalance(userEmail, amount)
      .then(newBalance => {
        setIsProcessing(false);
        // Update currentBalance state
        setCurrentBalance(newBalance);
        
        Alert.alert(
          'Payment Successful',
          `₹${amount} has been added to your balance. New balance: ₹${newBalance}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to dashboard with the topup amount as a parameter
                router.replace({
                  pathname: '/(authenticated)/renter/(screens)/dashboard',
                  params: { topUpAmount: amount.toString() }
                });
              }
            }
          ]
        );
      })
      .catch(error => {
        console.error('Payment processing failed:', error);
        setIsProcessing(false);
        Alert.alert(
          'Payment Failed',
          'There was an error processing your payment. Please try again.',
          [{ text: 'OK' }]
        );
      });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Balance</Text>
      </View>

      <View style={styles.currentBalanceBox}>
        <Text style={styles.currentBalanceLabel}>Current Balance</Text>
        <Text style={styles.currentBalanceAmount}>₹{currentBalance}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Amount</Text>
        <View style={styles.amountOptions}>
          {amountOptions.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.amountOption,
                selectedAmount === amount && styles.selectedAmountOption,
              ]}
              onPress={() => handleAmountSelect(amount)}
            >
              <Text
                style={[
                  styles.amountText,
                  selectedAmount === amount && styles.selectedAmountText,
                ]}
              >
                ₹{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customAmountContainer}>
          <Text style={styles.customAmountLabel}>Or enter custom amount</Text>
          <View style={styles.customAmountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.customAmountInput}
              placeholder="Enter amount"
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              maxLength={6}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        <View style={styles.paymentMethods}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
              ]}
              onPress={() => handlePaymentMethodSelect(method.id)}
            >
              <PaymentMethodIcon type={method.iconType} />
              <Text style={styles.paymentMethodName}>{method.name}</Text>
              {selectedPaymentMethod === method.id && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryValue}>₹{getFinalAmount()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Transaction Fee</Text>
          <Text style={styles.summaryValue}>₹0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{getFinalAmount()}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payButton, !isValidPayment() && styles.disabledButton]}
        onPress={processPayment}
        disabled={!isValidPayment() || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Proceed to Pay</Text>
        )}
      </TouchableOpacity>

      <View style={styles.securePaymentInfo}>
        <Ionicons name="lock-closed" size={16} color={Colors.light.icon} />
        <Text style={styles.securePaymentText}>
          Secure payments powered by CodeZ Payments
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  amountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountOption: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedAmountOption: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedAmountText: {
    color: '#fff',
  },
  customAmountContainer: {
    marginTop: 8,
  },
  customAmountLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 8,
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: Colors.light.text,
    marginRight: 4,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedPaymentMethod: {
    borderColor: Colors.light.tint,
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
  },
  paymentMethodName: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  checkmark: {
    position: 'absolute',
    right: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
  },
  summarySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  payButton: {
    margin: 16,
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  securePaymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  securePaymentText: {
    fontSize: 12,
    color: Colors.light.icon,
    marginLeft: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBalanceBox: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: Colors.light.tint + '20',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentBalanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  currentBalanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
}); 