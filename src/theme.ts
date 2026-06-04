// Shared palette. Kept deliberately tiny — color tokens only, no
// StyleSheet definitions. Per-component styles stay co-located.
//
// Vibe: warm, soft, kid-friendly. Light brown is the primary action
// color; surfaces are warm-dark (cocoa-ish) rather than cool-slate;
// text is cream rather than pure white.

export const COLORS = {
  // Brand / actions
  brand: '#C9A27A',         // light brown — buttons, primary highlights
  brandDeep: '#8A6B47',     // deeper brown — pressed states, secondary accent
  brandLight: '#E6CBA8',    // soft caramel — flashcard name on dark backdrops

  // Warm dark surfaces (replace the old cool slates)
  surface: 'rgba(36,28,22,0.95)',     // result card surface
  surfaceMuted: 'rgba(46,36,28,0.7)', // placeholder/secondary panels
  scrim: 'rgba(28,20,14,0.55)',       // flashcard scrim over blurred camera

  // Text on dark
  textOnDark: '#F5EBD9',    // cream, replaces stark white
  textOnDarkSoft: '#D9CBB5',// secondary/muted cream
  accentLabel: '#E8A87C',   // soft terracotta — code-type label, replaces green

  // Text on light (PermissionGate background)
  bgLight: '#FAF5EE',       // creamy background
  textOnLight: '#3C2E20',   // deep brown
  textOnLightSoft: '#6B5A4A',// brown-grey for body copy

  // Shadow tint (warmer than pure black)
  shadow: 'rgba(28,20,14,0.55)',
};
