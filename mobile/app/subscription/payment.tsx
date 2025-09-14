import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { usePremium } from '../../contexts/PremiumContext';
import { HeaderComponent } from '../../components/HeaderComponent';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';

interface PaymentMethod {
  id: string;
  type: 'apple' | 'google' | 'card';
  title: string;
  subtitle: string;
  icon: string;
}

export default function PaymentScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setPremiumStatus } = usePremium();

  // Get plan details from params
  const planId = params.planId as string || 'monthly';
  const planTitle = params.planTitle as string || 'Monthly Premium';
  const planPrice = params.planPrice as string || '$4.99';
  const planPeriod = params.planPeriod as string || 'month';

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('apple');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'apple',
      type: 'apple',
      title: 'Apple Pay',
      subtitle: 'Pay with Touch ID or Face ID',
      icon: 'apple',
    },
    {
      id: 'google',
      type: 'google',
      title: 'Google Pay',
      subtitle: 'Pay with your Google account',
      icon: 'google',
    },
    {
      id: 'card',
      type: 'card',
      title: 'Credit or Debit Card',
      subtitle: 'Visa, Mastercard, American Express',
      icon: 'credit-card',
    },
  ];

  const formatCardNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const formatCVV = (text: string) => {
    // Remove all non-numeric characters and limit to 4 digits
    return text.replace(/\D/g, '').substring(0, 4);
  };

  const validateCardDetails = () => {
    if (selectedPaymentMethod !== 'card') return true;

    const { cardNumber, expiryDate, cvv, cardholderName } = cardDetails;

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid card number.');
      return false;
    }

    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert('Invalid Expiry', 'Please enter a valid expiry date.');
      return false;
    }

    if (!cvv || cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV.');
      return false;
    }

    if (!cardholderName.trim()) {
      Alert.alert('Missing Name', 'Please enter the cardholder name.');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateCardDetails()) return;

    try {
      setIsProcessing(true);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate random success/failure (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        // Enable premium status
        await setPremiumStatus(true);

        // Navigate to success screen
        router.replace({
          pathname: '/subscription/payment-success',
          params: {
            planTitle,
            planPrice,
            planPeriod,
            paymentMethod: paymentMethods.find(p => p.id === selectedPaymentMethod)?.title || 'Payment Method',
          }
        });
      } else {
        // Navigate to failure screen
        router.push({
          pathname: '/subscription/payment-failure',
          params: {
            planTitle,
            planPrice,
            reason: 'Payment declined by your bank. Please try a different payment method.',
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      onPress={() => setSelectedPaymentMethod(method.id)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: selectedPaymentMethod === method.id
          ? theme.colors.wizard.primary + '20'
          : theme.colors.theme.surface,
        borderRadius: theme.borderRadius.lg,
        borderWidth: selectedPaymentMethod === method.id ? 2 : 1,
        borderColor: selectedPaymentMethod === method.id
          ? theme.colors.wizard.primary
          : theme.colors.theme.border,
        marginBottom: theme.spacing.md,
      }}
    >
      <MaterialCommunityIcons
        name={method.icon as any}
        size={24}
        color={selectedPaymentMethod === method.id
          ? theme.colors.wizard.primary
          : theme.colors.theme.textSecondary
        }
        style={{ marginRight: theme.spacing.md }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: theme.typography.fontSize.bodyLarge,
          fontWeight: theme.typography.fontWeight.medium,
          color: selectedPaymentMethod === method.id
            ? theme.colors.wizard.primary
            : theme.colors.theme.text,
          marginBottom: theme.spacing.xs,
        }}>
          {method.title}
        </Text>
        <Text style={{
          fontSize: theme.typography.fontSize.bodyMedium,
          color: theme.colors.theme.textSecondary,
        }}>
          {method.subtitle}
        </Text>
      </View>
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selectedPaymentMethod === method.id
          ? theme.colors.wizard.primary
          : theme.colors.theme.border,
        backgroundColor: selectedPaymentMethod === method.id
          ? theme.colors.wizard.primary
          : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {selectedPaymentMethod === method.id && (
          <MaterialCommunityIcons
            name="check"
            size={12}
            color="#ffffff"
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
      <HeaderComponent
        title="Payment Details"
        subtitle={`${planTitle} • ${planPrice}/${planPeriod}`}
        rightContent={
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.colors.theme.text}
            />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Summary */}
          <View style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.wizard.primary + '10',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.wizard.primary + '30',
            marginBottom: theme.spacing.xl,
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.titleMedium,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              marginBottom: theme.spacing.md,
            }}>
              Order Summary
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.sm,
            }}>
              <Text style={{
                fontSize: theme.typography.fontSize.bodyLarge,
                color: theme.colors.theme.text,
              }}>
                {planTitle}
              </Text>
              <Text style={{
                fontSize: theme.typography.fontSize.bodyLarge,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.wizard.primary,
              }}>
                {planPrice}
              </Text>
            </View>
            <Text style={{
              fontSize: theme.typography.fontSize.bodySmall,
              color: theme.colors.theme.textSecondary,
            }}>
              Billed {planPeriod === 'year' ? 'annually' : 'monthly'} • Cancel anytime
            </Text>
          </View>

          {/* Payment Methods */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text style={{
              fontSize: theme.typography.fontSize.titleMedium,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              marginBottom: theme.spacing.lg,
            }}>
              Payment Method
            </Text>
            {paymentMethods.map(renderPaymentMethod)}
          </View>

          {/* Card Details Form */}
          {selectedPaymentMethod === 'card' && (
            <View style={{ marginBottom: theme.spacing.xl }}>
              <Text style={{
                fontSize: theme.typography.fontSize.titleMedium,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.theme.text,
                marginBottom: theme.spacing.lg,
              }}>
                Card Details
              </Text>

              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.sm,
                }}>
                  Card Number
                </Text>
                <TextInput
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChangeText={(text) => setCardDetails(prev => ({
                    ...prev,
                    cardNumber: formatCardNumber(text)
                  }))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={{
                flexDirection: 'row',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.md,
              }}>
                <View style={{ flex: 2 }}>
                  <Text style={{
                    fontSize: theme.typography.fontSize.bodyMedium,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.theme.text,
                    marginBottom: theme.spacing.sm,
                  }}>
                    Expiry Date
                  </Text>
                  <TextInput
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChangeText={(text) => setCardDetails(prev => ({
                      ...prev,
                      expiryDate: formatExpiryDate(text)
                    }))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{
                    fontSize: theme.typography.fontSize.bodyMedium,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.theme.text,
                    marginBottom: theme.spacing.sm,
                  }}>
                    CVV
                  </Text>
                  <TextInput
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChangeText={(text) => setCardDetails(prev => ({
                      ...prev,
                      cvv: formatCVV(text)
                    }))}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.theme.text,
                  marginBottom: theme.spacing.sm,
                }}>
                  Cardholder Name
                </Text>
                <TextInput
                  placeholder="Full name as it appears on card"
                  value={cardDetails.cardholderName}
                  onChangeText={(text) => setCardDetails(prev => ({
                    ...prev,
                    cardholderName: text
                  }))}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Security Notice */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.md,
            backgroundColor: theme.colors.theme.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: theme.colors.theme.border,
            marginBottom: theme.spacing.xl,
          }}>
            <MaterialCommunityIcons
              name="shield-check"
              size={20}
              color={theme.colors.status.success}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text style={{
              fontSize: theme.typography.fontSize.bodySmall,
              color: theme.colors.theme.textSecondary,
              flex: 1,
              lineHeight: 18,
            }}>
              Your payment information is secure and encrypted. This is a demo - no real charges will be made.
            </Text>
          </View>

          {/* Subscribe Button */}
          <Button
            onPress={handlePayment}
            variant="primary"
            leftIcon="crown"
            loading={isProcessing}
            style={{ marginBottom: theme.spacing.xl }}
          >
            {isProcessing ? 'Processing Payment...' : `Subscribe for ${planPrice}`}
          </Button>

          {/* Terms */}
          <Text style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: theme.colors.theme.textTertiary,
            textAlign: 'center',
            lineHeight: 18,
          }}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. This is a development demo - no actual payment will be processed.
          </Text>

          <View style={{ marginBottom: theme.spacing['2xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}