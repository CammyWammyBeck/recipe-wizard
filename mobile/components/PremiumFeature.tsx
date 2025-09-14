import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAppTheme } from '../constants/ThemeProvider';
import { Button } from './Button';

interface PremiumFeatureProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
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
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.theme.surface,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing['2xl'],
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
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
        </View>
      </View>
    </Modal>
  );
};

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  featureName,
  description,
  style,
  size = 'medium',
}) => {
  const { theme } = useAppTheme();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check premium status from environment variable
  const isPremium = Constants.expoConfig?.extra?.isPremium ?? false;

  // Size configurations for replace mode
  const sizeConfig = {
    small: {
      titleSize: theme.typography.fontSize.titleMedium,
      showDescription: false,
      showBadge: true,
      badgePosition: 'floating' as const,
    },
    medium: {
      titleSize: theme.typography.fontSize.titleMedium,
      descriptionSize: theme.typography.fontSize.bodyMedium,
      showDescription: true,
      showBadge: true,
      badgePosition: 'floating' as const,
    },
    large: {
      titleSize: theme.typography.fontSize.titleLarge,
      descriptionSize: theme.typography.fontSize.bodyLarge,
      showDescription: true,
      showBadge: true,
      badgePosition: 'centered' as const,
    },
  };

  const config = sizeConfig[size];

  // If user has premium, just render children normally
  if (isPremium) {
    return <>{children}</>;
  }

  // Replace mode - show premium feature placeholder
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
            position: 'relative',
          },
          style,
        ]}
        onPress={() => setShowUpgradeModal(true)}
        activeOpacity={0.7}
      >
        {/* Badge - floating or centered based on config */}
        {config.showBadge && config.badgePosition === 'floating' && (
            <View
              style={{
                position: 'absolute',
                top: -12,
                left: theme.spacing.lg,
                backgroundColor: theme.colors.wizard.primary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                zIndex: 10,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
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
          )}

          {/* Main content - centered */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Centered badge for large size */}
            {config.showBadge && config.badgePosition === 'centered' && (
              <View
                style={{
                  backgroundColor: theme.colors.wizard.primary,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: theme.spacing.lg,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <MaterialCommunityIcons
                  name="crown"
                  size={16}
                  color="#ffffff"
                  style={{ marginRight: theme.spacing.xs }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.bodyMedium,
                    fontWeight: theme.typography.fontWeight.bold,
                    color: '#ffffff',
                  }}
                >
                  Premium Only Feature
                </Text>
              </View>
            )}

            <Text
              style={{
                fontSize: config.titleSize,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.theme.text,
                textAlign: 'center',
                marginBottom: config.showDescription ? theme.spacing.md : theme.spacing.lg,
              }}
            >
              {featureName}
            </Text>

            {config.showDescription && (
              <Text
                style={{
                  fontSize: config.descriptionSize,
                  color: theme.colors.theme.textSecondary,
                  textAlign: 'center',
                  lineHeight: config.descriptionSize * 1.4,
                  marginBottom: theme.spacing.xl,
                  paddingHorizontal: theme.spacing.md,
                }}
              >
                {description || `Unlock ${featureName} with Premium subscription`}
              </Text>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="crown"
                size={18}
                color={theme.colors.wizard.accent}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyLarge,
                  fontWeight: theme.typography.fontWeight.semibold,
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
};