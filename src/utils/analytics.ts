import ReactGA from "react-ga4";
import { logger } from "./logger";

// GA4 Measurement ID
const GA_MEASUREMENT_ID = import.meta.env?.VITE_GA_MEASUREMENT_ID;

// Track initialization status
let isInitialized = false;

export const initGA = () => {
  if (isInitialized) return;

  if (GA_MEASUREMENT_ID) {
    try {
      logger.log(`🔌 Initializing GA4 with ID: ${GA_MEASUREMENT_ID}`);

      ReactGA.initialize(GA_MEASUREMENT_ID, {
        gtagOptions: {
          debug_mode: import.meta.env.DEV, // Only enable debug mode in DEV
          cookie_flags: 'SameSite=None;Secure' // Required for iframes
        }
      });

      isInitialized = true;
      logger.log("✅ GA4 Initialized via ReactGA");
    } catch (error) {
      logger.error("❌ GA4 Initialization Error:", error);
    }
  } else {
    logger.log("⚠️ GA4 Measurement ID missing");
  }
};

export const logPageView = () => {
  if (!isInitialized) initGA();

  try {
    const path = window.location.pathname + window.location.search;
    ReactGA.send({ hitType: "pageview", page: path });
    logger.log(`📡 Page View sent: ${path}`);
  } catch (error) {
    logger.error("❌ Failed to send Page View:", error);
  }
};

export type AnalyticsEvent =
  | {
    name: 'click_add_sound';
    params: {
      method: 'header' | 'soundcard_area';
    };
  }
  | {
    name: 'event_upload_sound';
    params: {
      file_ext: string;
      file_size: number;
    }
  }
  | {
    name: 'event_fail_upload_sound';
    params: {
      file_ext: string;
      error_code: string;
      file_size: number;
    }
  }
  | {
    name: 'event_set_hotkey';
    params: {
      key_combo: string;
      sound_id: string;
    };
  }
  | {
    name: 'event_play_sound';
    params: {
      method: 'click' | 'hotkey';
      source_type: 'demo' | 'user_upload';
    };
  }
  | {
    name: 'event_trim_sound';
    params: {
      sound_id: string;
    };
  }
  | {
    name: 'event_reorder_sound';
    params: {
      sound_id: string;
    };
  }
  | {
    name: 'event_edit_sound';
    params: {
      sound_id: string;
    };
  }
  | {
    name: 'click_signup';
    params: {
      trigger_source: 'Header_btn' | 'Save_popup';
    };
  }
  | {
    name: 'event_signup_complete';
    params: {
      user_id: string;
    };
  }
  | {
    name: 'event_delete_sound';
    params: {
      sound_id: string;
    };
  }
  | {
    name: 'event_signout';
    params: {
      user_id: string;
    };
  }
  | {
    name: 'event_delete_account';
    params: {
      user_id: string;
    };
  }
  | {
    name: 'event_restore_default_setting';
    params: {
      user_id: string;
    };
  };

export const logAnalyticsEvent = (event: AnalyticsEvent) => {
  if (!isInitialized) initGA();

  try {
    ReactGA.event(event.name, event.params);

    // Log directly to console in dev mode via logger
    logger.log(`📊 [Analytics] ${event.name}:`, event.params);
  } catch (error) {
    logger.error("❌ Failed to send Event:", error);
  }
};

// Deprecated: Use logAnalyticsEvent instead
export const logEvent = (category: string, action: string, label?: string) => {
  logAnalyticsEvent({ // Fallback mapping for legacy calls, ideally remove this later
    name: `legacy_${category}_${action}` as any,
    params: { label }
  } as any);
};
