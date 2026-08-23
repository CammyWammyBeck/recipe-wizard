import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput as RNTextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';

import { useAppTheme } from '../../constants/ThemeProvider';
import { usePreferences } from '../../contexts/PreferencesContext';
import { SettingsScreen } from '../../components/settings';
import { TextInput } from '../../components/TextInput';
import { DEFAULT_GROCERY_CATEGORIES } from '../../types/api';

/** 'dry-goods' -> 'Dry goods'. Replaces every hyphen, not just the first. */
function humanize(value: string): string {
  const spaced = value.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function GroceryCategoriesScreen() {
  const { theme } = useAppTheme();
  const {
    preferences,
    addListItem,
    removeListItem,
    reorderList,
    setPreference,
  } = usePreferences();
  const inputRef = useRef<RNTextInput>(null);

  const categories = preferences.groceryCategories;

  const handleReorder = useCallback(
    (from: number, to: number) => reorderList('groceryCategories', from, to),
    [reorderList]
  );

  const handleMove = useCallback(
    (index: number, direction: -1 | 1) =>
      reorderList('groceryCategories', index, index + direction),
    [reorderList]
  );

  // Stable identity so the memoized row renderer isn't invalidated every
  // render — the previous implementation depended on an unmemoized function,
  // which silently defeated its own useCallback and re-rendered every row on
  // every frame of a drag.
  const handleRemove = useCallback(
    (category: string) => {
      Alert.alert(
        'Remove category?',
        `"${humanize(category)}" will no longer be used to group your shopping list. Existing items keep their current grouping.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeListItem('groceryCategories', category),
          },
        ]
      );
    },
    [removeListItem]
  );

  const handleAdd = useCallback(
    (text: string) => {
      const trimmed = text.trim().toLowerCase();
      if (!trimmed) return;
      addListItem('groceryCategories', trimmed);
      inputRef.current?.clear();
    },
    [addListItem]
  );

  const handleRestoreDefaults = useCallback(() => {
    Alert.alert(
      'Restore default categories?',
      'This replaces your current list and ordering with the defaults. Custom categories you added will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: () =>
            setPreference('groceryCategories', [...DEFAULT_GROCERY_CATEGORIES]),
        },
      ]
    );
  }, [setPreference]);

  const renderItem = useCallback(
    (info: DragListRenderItemInfo<string>) => {
      const { item, index, onDragStart, onDragEnd, isActive } = info;
      const isFirst = index === 0;
      const isLast = index === categories.length - 1;

      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 56,
            paddingLeft: theme.spacing.xs,
            paddingRight: theme.spacing.xs,
            marginBottom: theme.spacing.sm,
            borderRadius: theme.borderRadius.lg,
            backgroundColor: isActive
              ? theme.colors.wizard.primary + '1A'
              : theme.colors.theme.surface,
            borderWidth: 1,
            borderColor: isActive
              ? theme.colors.wizard.primary
              : theme.colors.theme.border,
            ...(isActive ? theme.shadows.surface : null),
            elevation: isActive ? 4 : 0,
          }}
        >
          {/*
            Drag activates from this handle only, on long press. Binding
            onDragStart to onPressIn across the whole row (the previous
            behaviour) claimed the gesture the instant a finger landed, so it
            raced the surrounding scroll view and swallowed taps on the
            delete button.
          */}
          <TouchableOpacity
            onLongPress={onDragStart}
            onPressOut={onDragEnd}
            delayLongPress={150}
            accessible={false}
            importantForAccessibility="no"
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={{
              width: 40,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="drag-horizontal-variant"
              size={22}
              color={
                isActive
                  ? theme.colors.wizard.primary
                  : theme.colors.theme.textTertiary
              }
            />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: theme.typography.fontSize.bodyLarge,
              fontWeight: isActive
                ? theme.typography.fontWeight.semibold
                : theme.typography.fontWeight.regular,
              fontFamily: theme.typography.fontFamily.body,
              color: isActive
                ? theme.colors.wizard.primary
                : theme.colors.theme.text,
            }}
          >
            {humanize(item)}
          </Text>

          {/* Keyboard/screen-reader accessible alternative to dragging. */}
          <TouchableOpacity
            onPress={() => handleMove(index, -1)}
            disabled={isFirst}
            accessibilityRole="button"
            accessibilityLabel={`Move ${humanize(item)} up`}
            accessibilityState={{ disabled: isFirst }}
            style={{
              width: 36,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isFirst ? 0.25 : 1,
            }}
          >
            <MaterialCommunityIcons
              name="chevron-up"
              size={22}
              color={theme.colors.theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleMove(index, 1)}
            disabled={isLast}
            accessibilityRole="button"
            accessibilityLabel={`Move ${humanize(item)} down`}
            accessibilityState={{ disabled: isLast }}
            style={{
              width: 36,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLast ? 0.25 : 1,
            }}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={22}
              color={theme.colors.theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemove(item)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${humanize(item)}`}
            style={{
              width: 40,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.colors.status.error}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [theme, categories.length, handleMove, handleRemove]
  );

  return (
    <SettingsScreen
      title="Grocery Categories"
      subtitle={`${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
      scroll={false}
    >
      <DragList
        data={categories}
        // Categories are unique (adds are de-duplicated), so the value is a
        // stable key. The old `${item}-${index}` key changed as rows moved,
        // remounting the row mid-drag and dropping the gesture.
        keyExtractor={(item) => item}
        onReordered={handleReorder}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing['4xl'],
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Text
            style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textSecondary,
              fontFamily: theme.typography.fontFamily.body,
              lineHeight: 20,
              marginBottom: theme.spacing.lg,
            }}
          >
            These control how your shopping list is grouped, in this order.
            Hold the handle to drag a category, or use the arrows.
          </Text>
        }
        ListFooterComponent={
          <View style={{ marginTop: theme.spacing.md }}>
            <TextInput
              ref={inputRef}
              placeholder="Add a category..."
              returnKeyType="done"
              autoCapitalize="none"
              onSubmitEditing={(e) => handleAdd(e.nativeEvent.text)}
            />

            <TouchableOpacity
              onPress={handleRestoreDefaults}
              accessibilityRole="button"
              style={{
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: theme.spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.bodyMedium,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.body,
                  color: theme.colors.wizard.primary,
                }}
              >
                Restore defaults
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <Text
            style={{
              fontSize: theme.typography.fontSize.bodyMedium,
              color: theme.colors.theme.textTertiary,
              fontFamily: theme.typography.fontFamily.body,
              textAlign: 'center',
              paddingVertical: theme.spacing.xl,
            }}
          >
            No categories yet. Add one below, or restore the defaults.
          </Text>
        }
      />
    </SettingsScreen>
  );
}
