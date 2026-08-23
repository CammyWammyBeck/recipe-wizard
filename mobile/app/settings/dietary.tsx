import React from 'react';

import { usePreferences } from '../../contexts/PreferencesContext';
import { SettingsScreen, ChecklistEditor } from '../../components/settings';

export const COMMON_DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'low-carb',
  'keto',
  'paleo',
  'halal',
  'kosher',
] as const;

export default function DietaryRestrictionsScreen() {
  const { preferences } = usePreferences();
  const count = preferences.dietaryRestrictions.length;

  return (
    <SettingsScreen
      title="Dietary Restrictions"
      subtitle={count > 0 ? `${count} selected` : 'None selected'}
    >
      <ChecklistEditor
        listKey="dietaryRestrictions"
        commonOptions={COMMON_DIETARY_RESTRICTIONS}
        sectionLabel="Common restrictions"
        customLabel="Your own"
        inputPlaceholder="Add a restriction..."
        footer="Every recipe is generated to respect these. For safety-critical avoidances, use Allergens instead."
      />
    </SettingsScreen>
  );
}
