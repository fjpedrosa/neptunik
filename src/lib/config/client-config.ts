/**
 * Client-side configuration
 *
 * Centralizes all client-side environment variables to avoid HMR issues with Turbopack.
 * This file isolates process.env access, preventing "module factory not available" errors
 * during hot module replacement in Next.js 15.5.2 with Turbopack.
 *
 * @see https://github.com/vercel/next.js/issues/turbopack-hmr
 */

/**
 * Client configuration object with all environment variables
 * Using a single object prevents multiple process.env accesses
 */
export const clientConfig = {
  /**
   * PostHog Analytics Configuration
   */
  posthog: {
    // API key for PostHog analytics
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    // Host URL for PostHog (EU or US)
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
    // Enable PostHog in development
    enableInDev: process.env.NEXT_PUBLIC_ENABLE_POSTHOG_DEV === 'true',
  },

  /**
   * Supabase Configuration
   */
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  /**
   * WhatsApp Cloud API Configuration
   */
  whatsapp: {
    businessId: process.env.NEXT_PUBLIC_WA_BUSINESS_ID || '',
    phoneNumberId: process.env.NEXT_PUBLIC_WA_PHONE_NUMBER_ID || '',
  },

  /**
   * Application Configuration
   */
  app: {
    // Current environment
    env: process.env.NODE_ENV || 'development',
    // Is production environment
    isProduction: process.env.NODE_ENV === 'production',
    // Is development environment
    isDevelopment: process.env.NODE_ENV === 'development',
    // Application URL
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    // API URL (Next.js API routes - acts as gateway/proxy)
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    // Backend API URL (separate backend service with Prisma)
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://api.neptunik.com'
        : 'http://localhost:3030'),
  },

  /**
   * Feature Flags
   */
  features: {
    // Enable debug mode
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
    // Enable performance monitoring
    performanceMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
    // Enable error tracking
    errorTracking: process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING === 'true',
  },
} as const;

// Type exports for better type safety
export type ClientConfig = typeof clientConfig;
export type PostHogConfig = typeof clientConfig.posthog;
export type SupabaseConfig = typeof clientConfig.supabase;
export type AppConfig = typeof clientConfig.app;
export type FeatureFlags = typeof clientConfig.features;

// Validation helper to check if required env vars are set
export const validateClientConfig = (): { isValid: boolean; missingVars: string[] } => {
  const missingVars: string[] = [];

  // Check required PostHog config
  if (!clientConfig.posthog.key && clientConfig.app.isProduction) {
    missingVars.push('NEXT_PUBLIC_POSTHOG_KEY');
  }

  // Check required Supabase config
  if (!clientConfig.supabase.url) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!clientConfig.supabase.anonKey) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
};

// Helper to check if analytics should be enabled
export const shouldEnableAnalytics = (): boolean => {
  const { app, posthog } = clientConfig;

  // Enable in production always
  if (app.isProduction) return true;

  // In development, only if explicitly enabled
  if (app.isDevelopment && posthog.enableInDev) return true;

  return false;
};

// Debug helper (only logs in development or when debug is enabled)
export const debugLog = (message: string, data?: any): void => {
  if (clientConfig.app.isDevelopment || clientConfig.features.debug) {
    console.log(`[ClientConfig] ${message}`, data);
  }
};