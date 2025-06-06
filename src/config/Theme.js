export const colors = {
  // Primary colors
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#64B5F6',
  primaryBackground: '#E3F2FD',
  
  // Secondary colors
  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  secondaryLight: '#81C784',
  
  // Alert colors
  success: '#4CAF50',
  warning: '#FFB800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral colors
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  border: '#E0E0E0',
  divider: '#F0F0F0',
  
  // Shadows
  shadow: '#000000',
  
  // Category specific
  categoryIconBackground: (color) => color + '20',
};

export const typography = {
  // Font sizes
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  h5: {
    fontSize: 16,
    fontWeight: '600',
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animations = {
  fast: 200,
  normal: 300,
  slow: 500,
  
  // Timing functions
  timing: {
    accelerate: [0.4, 0.0, 1, 1],
    decelerate: [0.0, 0.0, 0.2, 1],
    standard: [0.4, 0.0, 0.2, 1],
  },
  
  // Spring configs
  spring: {
    default: {
      tension: 40,
      friction: 7,
    },
    bouncy: {
      tension: 50,
      friction: 5,
    },
    stiff: {
      tension: 100,
      friction: 10,
    },
  },
};