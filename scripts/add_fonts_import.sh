#!/bin/bash
# Apply Outfit fontFamily to all screen/component StyleSheets
# Strategy: inject fontFamily into each fontSize/fontWeight block

FILES=(
  "src/screens/HomeScreen.tsx"
  "src/screens/AuthScreen.tsx"
  "src/screens/BookingsScreen.tsx"
  "src/screens/BookingFlowScreen.tsx"
  "src/screens/FacilityDetailScreen.tsx"
  "src/screens/CategoryFacilitiesScreen.tsx"
  "src/screens/ProfileScreen.tsx"
  "src/screens/NotificationScreen.tsx"
  "src/screens/AccessScreen.tsx"
  "src/screens/PlanDetailScreen.tsx"
  "src/components/Header.tsx"
  "src/components/FacilityCard.tsx"
  "src/components/StatusBadge.tsx"
  "src/components/AnimatedSplash.tsx"
)

for FILE in "${FILES[@]}"; do
  # Add FONTS to imports if not already present
  if ! grep -q "FONTS" "$FILE"; then
    # Replace existing theme import to include FONTS
    sed -i '' "s/import { COLORS,/import { COLORS, FONTS,/g" "$FILE"
    sed -i '' "s/import { COLORS }/import { COLORS, FONTS }/g" "$FILE"
    # Handle cases where TYPOGRAPHY or other exports are already imported
    sed -i '' "s/from '..\/theme\/theme'/from '..\/theme\/theme'/g" "$FILE"
    sed -i '' "s/from '..\/..\/theme\/theme'/from '..\/..\/theme\/theme'/g" "$FILE"
  fi
done

echo "Done adding FONTS imports."
