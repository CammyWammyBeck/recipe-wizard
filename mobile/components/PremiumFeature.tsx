import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Portal, Modal } from 'react-native-paper';
import Constants from 'expo-constants';
import { useAppTheme } from '../constants/ThemeProvider';
import { Button } from './Button';

interface PremiumFeatureProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
  style?: ViewStyle;
  mode?: 'overlay' | 'replace';
}

interface UpgradeModalProps {
  visible: boolean;
  onDismiss: () => void;
  featureName: string;
  description?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onDismiss,
  featureName,
  description,
}) => {
  const { theme } = useAppTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: theme.colors.theme.surface,
          margin: 20,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing['2xl'],
          alignItems: 'center',
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.wizard.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.lg,
            }}
          >
            <MaterialCommunityIcons
              name="crown"
              size={40}
              color={theme.colors.wizard.primary}
            />
          </View>

          <Text
            style={{
              fontSize: theme.typography.fontSize.headlineSmall,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.theme.text,
              textAlign: 'center',
              marginBottom: theme.spacing.sm,
            }}
          >
            Premium Feature
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.bodyLarge,
              color: theme.colors.theme.textSecondary,
              textAlign: 'center',
              marginBottom: theme.spacing.lg,
            }}
          >
            {featureName} requires a Premium subscription
          </Text>

          {description && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: theme.spacing.xl,
              }}
            >
              {description}
            </Text>
          )}
        </View>

        <View style={{ width: '100%', gap: theme.spacing.md }}>
          <Button
            variant="primary"
            onPress={() => {
              // TODO: Navigate to subscription flow
              console.log('Navigate to subscription');
              onDismiss();
            }}
            leftIcon="crown"
          >
            Upgrade to Premium
          </Button>

          <Button variant="secondary" onPress={onDismiss}>
            Maybe Later
          </Button>
        </View>

        <Text
          style={{
            fontSize: theme.typography.fontSize.bodySmall,
            color: theme.colors.theme.textTertiary,
            textAlign: 'center',
            marginTop: theme.spacing.lg,
          }}
        >
          Premium: $4.99/month • Cancel anytime
        </Text>
      </Modal>
    </Portal>
  );
};

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  featureName,
  description,
  style,
  mode = 'overlay',
}) => {
  const { theme } = useAppTheme();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check premium status from environment variable
  const isPremium = Constants.expoConfig?.extra?.isPremium ?? false;

  // If user has premium, just render children normally
  if (isPremium) {
    return <>{children}</>;
  }

  // Handle different modes for non-premium users
  if (mode === 'replace') {
    return (
      <>
        <TouchableOpacity
          style={[
            {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.colors.theme.backgroundSecondary,
              borderRadius: theme.borderRadius.lg,
              borderWidth: 2,
              borderColor: theme.colors.wizard.primary + '30',
              borderStyle: 'dashed',
              padding: theme.spacing['2xl'],
              minHeight: 200,
            },
            style,
          ]}
          onPress={() => setShowUpgradeModal(true)}
          activeOpacity={0.7}
        >
          <View
            style={{
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: theme.colors.wizard.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.lg,
              }}
            >
              <MaterialCommunityIcons
                name="lock"
                size={28}
                color={theme.colors.wizard.primary}
              />
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize.titleMedium,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.theme.text,
                textAlign: 'center',
                marginBottom: theme.spacing.sm,
              }}
            >
              {featureName}
            </Text>

            <View
              style={{
                backgroundColor: theme.colors.wizard.primary + '20',
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.lg,
                marginBottom: theme.spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.wizard.primary,
                  textAlign: 'center',
                }}
              >
                Premium Only Feature
              </Text>
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                color: theme.colors.theme.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: theme.spacing.lg,
              }}
            >
              {description || `Unlock ${featureName} with Premium subscription`}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="crown"
                size={16}
                color={theme.colors.wizard.accent}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.wizard.accent,
                  textAlign: 'center',
                }}
              >
                Tap to Upgrade
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <UpgradeModal
          visible={showUpgradeModal}
          onDismiss={() => setShowUpgradeModal(false)}
          featureName={featureName}
          description={description}
        />
      </>
    );
  }

  // Default overlay mode
  return (
    <>
      <View style={[{ position: 'relative' }, style]}>
        {/* Render children with reduced opacity */}
        <View style={{ opacity: 0.3 }}>{children}</View>

        {/* Premium overlay */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.theme.background + 'E0',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 2,
            borderColor: theme.colors.wizard.primary + '40',
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setShowUpgradeModal(true)}
          activeOpacity={0.8}
        >
          <View style={{ alignItems: 'center' }}>
            {/* Premium Only Badge */}
            <View
              style={{
                position: 'absolute',
                top: -30,
                backgroundColor: theme.colors.wizard.primary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <MaterialCommunityIcons
                name="crown"
                size={14}
                color="#ffffff"
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodySmall,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: '#ffffff',
                }}
              >
                Premium Only Feature
              </Text>
            </View>

            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colors.wizard.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <MaterialCommunityIcons
                name="lock"
                size={24}
                color={theme.colors.wizard.primary}
              />
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize.bodyMedium,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.theme.text,
                textAlign: 'center',
                marginBottom: theme.spacing.xs,
              }}
            >
              {featureName}
            </Text>

            <Text
              style={{
                fontSize: theme.typography.fontSize.bodySmall,
                color: theme.colors.theme.textSecondary,
                textAlign: 'center',
              }}
            >
              Tap to Upgrade
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <UpgradeModal
        visible={showUpgradeModal}
        onDismiss={() => setShowUpgradeModal(false)}
        featureName={featureName}
        description={description}
      />
    </>
  );
};