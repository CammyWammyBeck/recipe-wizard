import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/ThemeProvider';
import { usePremium } from '../../contexts/PremiumContext';
import { HeaderComponent } from '../../components/HeaderComponent';
import { Button } from '../../components/Button';

interface PaymentTransaction {
  id: string;
  date: string;
  amount: string;
  plan: string;
  period: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  description: string;
  receiptUrl?: string;
}

export default function PaymentHistoryScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Generate mock transaction data
  const generateMockTransactions = (): PaymentTransaction[] => {
    const mockTransactions: PaymentTransaction[] = [];
    const now = new Date();

    // Current subscription payment (most recent)
    if (isPremium) {
      mockTransactions.push({
        id: 'TXN' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        date: now.toISOString(),
        amount: '$4.99',
        plan: 'Monthly Premium',
        period: 'month',
        status: 'completed',
        paymentMethod: 'Apple Pay',
        description: 'Monthly Premium Subscription',
      });
    }

    // Generate 3-5 historical transactions
    const numHistoricalTransactions = Math.floor(Math.random() * 3) + 3;
    for (let i = 1; i <= numHistoricalTransactions; i++) {
      const transactionDate = new Date(now.getTime() - (i * 30 * 24 * 60 * 60 * 1000));
      const plans = ['Monthly Premium', 'Yearly Premium'];
      const amounts = ['$4.99', '$49.99'];
      const paymentMethods = ['Apple Pay', 'Google Pay', 'Credit Card ****1234'];
      const statuses: PaymentTransaction['status'][] = i === numHistoricalTransactions && Math.random() < 0.2 ? ['failed'] : ['completed'];

      const planIndex = Math.floor(Math.random() * plans.length);
      const plan = plans[planIndex];
      const amount = amounts[planIndex];

      mockTransactions.push({
        id: 'TXN' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        date: transactionDate.toISOString(),
        amount,
        plan,
        period: plan.includes('Yearly') ? 'year' : 'month',
        status: statuses[0],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        description: `${plan} Subscription`,
      });
    }

    return mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const loadTransactions = async () => {
    try {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = generateMockTransactions();
      setTransactions(mockData);
    } catch (error) {
      console.error('Failed to load payment history:', error);
      Alert.alert('Error', 'Failed to load payment history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTransactions();
  }, [isPremium]);

  const getStatusIcon = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'completed':
        return { name: 'check-circle', color: theme.colors.status.success };
      case 'pending':
        return { name: 'clock-outline', color: theme.colors.status.warning };
      case 'failed':
        return { name: 'alert-circle', color: theme.colors.status.error };
      case 'refunded':
        return { name: 'undo', color: theme.colors.theme.textSecondary };
      default:
        return { name: 'help-circle', color: theme.colors.theme.textTertiary };
    }
  };

  const getStatusText = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewReceipt = (transaction: PaymentTransaction) => {
    Alert.alert(
      'Receipt',
      `This would show the receipt for transaction ${transaction.id}. In production, this would download or display the receipt.`,
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = (transaction: PaymentTransaction) => {
    Alert.alert(
      'Contact Support',
      `This would open a support ticket for transaction ${transaction.id}. In production, this would pre-fill a support form with transaction details.`,
      [{ text: 'OK' }]
    );
  };

  const renderTransactionCard = (transaction: PaymentTransaction) => {
    const statusIcon = getStatusIcon(transaction.status);
    const isRecent = new Date().getTime() - new Date(transaction.date).getTime() < 7 * 24 * 60 * 60 * 1000;

    return (
      <TouchableOpacity
        key={transaction.id}
        style={{
          marginBottom: theme.spacing.md,
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.theme.surface,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: transaction.status === 'failed'
            ? theme.colors.status.error + '30'
            : theme.colors.theme.border,
          elevation: transaction.status === 'failed' ? 0 : 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
        onPress={() => {
          Alert.alert(
            'Transaction Details',
            `Transaction ID: ${transaction.id}\nDate: ${formatDate(transaction.date)} at ${formatTime(transaction.date)}\nAmount: ${transaction.amount}\nStatus: ${getStatusText(transaction.status)}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'View Receipt', onPress: () => handleViewReceipt(transaction) },
              ...(transaction.status === 'failed' ? [{ text: 'Contact Support', onPress: () => handleContactSupport(transaction) }] : [])
            ]
          );
        }}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialCommunityIcons
              name={statusIcon.name as any}
              size={20}
              color={statusIcon.color}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text style={{
              fontSize: theme.typography.fontSize.bodyLarge,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.theme.text,
              flex: 1,
            }}>
              {transaction.description}
            </Text>
            {isRecent && (
              <View style={{
                backgroundColor: theme.colors.wizard.primary,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.sm,
              }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: '#ffffff',
                }}>
                  Recent
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount and Status */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.sm,
        }}>
          <Text style={{
            fontSize: theme.typography.fontSize.headlineSmall,
            fontWeight: theme.typography.fontWeight.bold,
            color: transaction.status === 'failed'
              ? theme.colors.status.error
              : theme.colors.theme.text,
          }}>
            {transaction.amount}
          </Text>
          <Text style={{
            fontSize: theme.typography.fontSize.bodyMedium,
            fontWeight: theme.typography.fontWeight.medium,
            color: statusIcon.color,
          }}>
            {getStatusText(transaction.status)}
          </Text>
        </View>

        {/* Details */}
        <View style={{ gap: theme.spacing.xs }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
            }}>
              Plan
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.text,
            }}>
              {transaction.plan}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
            }}>
              Payment Method
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.text,
            }}>
              {transaction.paymentMethod}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
            }}>
              Date
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.text,
            }}>
              {formatDate(transaction.date)} • {formatTime(transaction.date)}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
            }}>
              Transaction ID
            </Text>
            <Text style={{
              fontSize: theme.typography.fontSize.bodySmall,
              color: theme.colors.theme.textTertiary,
              fontFamily: 'monospace',
            }}>
              {transaction.id}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing['2xl'],
    }}>
      <MaterialCommunityIcons
        name="receipt-outline"
        size={80}
        color={theme.colors.theme.textTertiary}
        style={{ marginBottom: theme.spacing.lg }}
      />
      <Text style={{
        fontSize: theme.typography.fontSize.titleLarge,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.theme.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
      }}>
        No Payment History
      </Text>
      <Text style={{
        fontSize: theme.typography.fontSize.bodyLarge,
        color: theme.colors.theme.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: theme.spacing['2xl'],
      }}>
        {isPremium
          ? 'Your payment history will appear here once you have transactions.'
          : 'Subscribe to Premium to see your payment history and manage your subscription.'
        }
      </Text>
      {!isPremium && (
        <Button
          onPress={() => router.push('/subscription/plans')}
          variant="primary"
          leftIcon="crown"
        >
          View Premium Plans
        </Button>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
        <HeaderComponent
          title="Payment History"
          subtitle="Loading transactions..."
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
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <MaterialCommunityIcons
            name="loading"
            size={40}
            color={theme.colors.wizard.primary}
          />
          <Text style={{
            fontSize: theme.typography.fontSize.bodyLarge,
            color: theme.colors.theme.textSecondary,
            marginTop: theme.spacing.md,
          }}>
            Loading payment history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.theme.background }} edges={['top']}>
      <HeaderComponent
        title="Payment History"
        subtitle={transactions.length > 0 ? `${transactions.length} transactions` : 'No transactions'}
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

      {transactions.length === 0 ? renderEmptyState() : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing.lg,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.wizard.primary}
            />
          }
        >
          {/* Summary Stats */}
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
              Payment Summary
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
              }}>
                Total Spent
              </Text>
              <Text style={{
                fontSize: theme.typography.fontSize.titleMedium,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.wizard.primary,
              }}>
                ${transactions.reduce((total, t) => {
                  if (t.status === 'completed') {
                    return total + parseFloat(t.amount.replace('$', ''));
                  }
                  return total;
                }, 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Transactions List */}
          <Text style={{
            fontSize: theme.typography.fontSize.titleMedium,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.theme.text,
            marginBottom: theme.spacing.lg,
          }}>
            Transaction History
          </Text>

          {transactions.map(renderTransactionCard)}

          {/* Development Notice */}
          <View style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.theme.surface,
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.theme.border,
          }}>
            <Text style={{
              fontSize: theme.typography.fontSize.bodySmall,
              color: theme.colors.theme.textTertiary,
              textAlign: 'center',
              lineHeight: 18,
            }}>
              Your subscription history and receipts are managed through your device's app store.
            </Text>
          </View>

          <View style={{ marginBottom: theme.spacing['2xl'] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}