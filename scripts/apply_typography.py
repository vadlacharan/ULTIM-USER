#!/usr/bin/env python3
"""
Apply Outfit fontFamily to all React Native StyleSheet text styles across the app.
Maps fontWeight values to the correct Outfit font family variant.
"""

import re
import os

# Weight → Outfit font family mapping
WEIGHT_MAP = {
    "'100'": 'FONTS.regular',
    "'200'": 'FONTS.regular',
    "'300'": 'FONTS.regular',
    "'400'": 'FONTS.regular',
    "'500'": 'FONTS.medium',
    "'600'": 'FONTS.semiBold',
    "'700'": 'FONTS.bold',
    "'800'": 'FONTS.extraBold',
    "'900'": 'FONTS.black',
    # Also handle numeric variants just in case
    '100': 'FONTS.regular',
    '400': 'FONTS.regular',
    '600': 'FONTS.semiBold',
    '700': 'FONTS.bold',
    '800': 'FONTS.extraBold',
    '900': 'FONTS.black',
}

TARGET_FILES = [
    'src/screens/HomeScreen.tsx',
    'src/screens/AuthScreen.tsx',
    'src/screens/BookingsScreen.tsx',
    'src/screens/BookingFlowScreen.tsx',
    'src/screens/FacilityDetailScreen.tsx',
    'src/screens/CategoryFacilitiesScreen.tsx',
    'src/screens/ProfileScreen.tsx',
    'src/screens/NotificationScreen.tsx',
    'src/screens/AccessScreen.tsx',
    'src/screens/PlanDetailScreen.tsx',
    'src/components/Header.tsx',
    'src/components/FacilityCard.tsx',
    'src/components/StatusBadge.tsx',
    'src/components/AnimatedSplash.tsx',
]

def ensure_fonts_import(content, filepath):
    """Ensure FONTS is imported from theme"""
    # Check if FONTS already imported
    if 'FONTS' in content:
        return content
    
    # Determine the relative path to theme
    depth = filepath.count('/')
    if 'components' in filepath or 'screens' in filepath:
        theme_path = '../theme/theme'
        if filepath.startswith('src/screens') or filepath.startswith('src/components'):
            theme_path = '../theme/theme'
    else:
        theme_path = './theme/theme'

    # Try to add FONTS to existing theme import
    content = re.sub(
        r"import \{ (COLORS[^}]*) \} from '(\.\.?/(?:\.\.?/)?theme/theme)'",
        lambda m: f"import {{ {m.group(1)}, FONTS }} from '{m.group(2)}'",
        content,
        count=1
    )
    return content

def inject_font_family(content):
    """
    Find each fontWeight declaration in a StyleSheet block and inject fontFamily above it.
    Skip if fontFamily is already present in the same style block.
    """
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Detect fontWeight line
        fw_match = re.match(r"(\s+)fontWeight:\s*'(\d+)',?$", line)
        if fw_match:
            indent = fw_match.group(1)
            weight = fw_match.group(2)
            font_family = WEIGHT_MAP.get(f"'{weight}'", 'FONTS.regular')
            
            # Check if fontFamily already set in surrounding ±5 lines
            context_start = max(0, len(result) - 6)
            context = '\n'.join(result[context_start:])
            
            if 'fontFamily' not in context:
                # Inject fontFamily line before fontWeight
                result.append(f"{indent}fontFamily: {font_family},")
            
            # Keep the fontWeight line for fallback compatibility
            result.append(line)
        else:
            result.append(line)
        
        i += 1
    
    return '\n'.join(result)

def process_file(filepath):
    if not os.path.exists(filepath):
        print(f"  SKIP (not found): {filepath}")
        return
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    content = ensure_fonts_import(content, filepath)
    content = inject_font_family(content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  UPDATED: {filepath}")
    else:
        print(f"  NO CHANGE: {filepath}")

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
    print("Applying Outfit fontFamily across all files...\n")
    for f in TARGET_FILES:
        process_file(f)
    print("\nDone!")
