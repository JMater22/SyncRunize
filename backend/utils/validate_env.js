// utils/validate_env.js
// ✅ FIX: Validate required environment variables on startup
// Prevents runtime errors due to missing configuration

const REQUIRED_ENV_VARS = {
  // Database (Supabase)
  SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL'
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    description: 'Supabase service role key for admin operations'
  },

  // Algorithm Engine
  ALGORITHM_ENGINE_URL: {
    required: true,
    description: 'FastAPI algorithm engine URL'
  },

  // Map Services
  MAP_SNAPSHOT_PROVIDER: {
    required: true,
    description: 'Map provider (mapbox or google)'
  },
  MAPBOX_ACCESS_TOKEN: {
    required: true,
    description: 'Mapbox API token for map snapshots',
    validate: (value) => {
      if (!value.startsWith('pk.')) {
        return 'Mapbox token should start with "pk."';
      }
      return null;
    }
  },

  // AI/OpenAI (Optional but recommended)
  OPENAI_API_KEY: {
    required: false,
    description: 'OpenAI API key for AI summaries',
    warning: 'OpenAI API key not set - AI summaries will use fallback messages'
  },

  // Redis Cache (Optional but recommended)
  REDIS_URL: {
    required: false,
    description: 'Redis connection URL for caching',
    warning: 'Redis not configured - performance may be degraded'
  },

  // Firebase Push Notifications (Optional but recommended)
  FCM_ANDROID_CHANNEL_ID: {
    required: false,
    description: 'Firebase Cloud Messaging Android channel ID',
    warning: 'Firebase channel ID not set - push notifications may not work'
  }
};

export const validateEnv = () => {
  console.log('\n🔍 Validating environment variables...\n');

  const errors = [];
  const warnings = [];

  // Check each required variable
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];

    if (!value || value.trim() === '') {
      if (config.required) {
        errors.push(`❌ Missing required variable: ${key} - ${config.description}`);
      } else if (config.warning) {
        warnings.push(`⚠️  ${config.warning}`);
      }
    } else {
      // Variable exists, run custom validation if provided
      if (config.validate) {
        const validationError = config.validate(value);
        if (validationError) {
          errors.push(`❌ Invalid ${key}: ${validationError}`);
        }
      }

      // Show success for required variables
      if (config.required) {
        console.log(`✅ ${key}: Set`);
      }
    }
  });

  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  // Print errors and exit if any
  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:\n');
    errors.forEach(error => console.error(`   ${error}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  console.log('\n✅ Environment validation passed!\n');
};
