import React from 'react';

import { usePreferences } from '../../contexts/PreferencesContext';
import { SettingsScreen, ChecklistEditor } from '../../components/settings';

export const COMMON_ALLERGENS = [
  'nuts',
  'peanuts',
  'shellfish',
  'fish',
  'eggs',
  'dairy',
  'soy',
  'gluten',
  'sesame',
] as const;

export default function AllergensScreen() {
  const { preferences } = usePreferences();
  const count = preferences.allergens.length;

  return (
    <SettingsScreen
      title="Allergens"
      subtitle={count > 0 ? `${count} selected` : 'None selected'}
    >
      <ChecklistEditor
        listKey="allergens"
        commonOptions={COMMON_ALLERGENS}
        sectionLabel="Common allergens"
        customLabel="Your own"
        inputPlaceholder="Add an allergen..."
        footer="Recipe Wizard excludes these ingredients from generated recipes. Always check ingredient labels yourself — this is not a substitute for medical advice."
      />
    </SettingsScreen>
  );
}
