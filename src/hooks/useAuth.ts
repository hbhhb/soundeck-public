import { useEffect, useRef } from "react";
import { supabase } from "../utils/supabase/client";
import { type User } from "../types";
import { logger } from "../utils/logger";
import { logAnalyticsEvent } from "../utils/analytics";
import { toast } from "sonner@2.0.3";
import { useTranslation } from "react-i18next";

interface UseAuthProps {
    user: User | null;
    setUser: (user: User | null) => void;
    onSignIn: (userId: string) => void;
    onSignOut: () => void;
    isInitialLoadRef: React.MutableRefObject<boolean>;
}

export const useAuth = ({
    user,
    setUser,
    onSignIn,
    onSignOut,
    isInitialLoadRef,
}: UseAuthProps) => {
    const { t } = useTranslation();
    const currentUserId = useRef<string | null>(null);

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            logger.log("🔍 Initial session check:", session);
            logger.log("🔍 User data:", session?.user);
            setUser(session?.user ?? null);

            const newUserId = session?.user?.id ?? null;

            if (newUserId && newUserId !== currentUserId.current) {
                // Load user data silently (no toast on page refresh)
                currentUserId.current = newUserId;
                onSignIn(newUserId);
            } else if (!newUserId) {
                // Not logged in
                currentUserId.current = null;
                isInitialLoadRef.current = false;
                onSignOut(); // Ensure state is reset
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            logger.log("🔔 Auth state changed:", event);
            logger.log("🔔 Session:", session);
            logger.log("🔔 User:", session?.user);
            setUser(session?.user ?? null);

            const newUserId = session?.user?.id ?? null;

            if (event === "SIGNED_IN" && isInitialLoadRef.current) {
                // Initial sign-in: Show loading skeleton and toast
                if (newUserId && newUserId !== currentUserId.current) {
                    currentUserId.current = newUserId;
                    toast.success(t('toast.signedInSuccess'));
                    onSignIn(newUserId);

                    // Check if new user (created within last minute)
                    const createdAt = session?.user?.created_at;
                    if (createdAt) {
                        const isNewUser = (new Date().getTime() - new Date(createdAt).getTime()) < 60000;
                        if (isNewUser) {
                            logAnalyticsEvent({
                                name: 'event_signup_complete',
                                params: { user_id: newUserId }
                            });
                        }
                    }
                }
            } else if (event === "SIGNED_IN" && !isInitialLoadRef.current) {
                // Tab refocus / session revalidation
                if (newUserId && newUserId !== currentUserId.current) {
                    // If the user actually changed, refresh data
                    currentUserId.current = newUserId;
                    onSignIn(newUserId);
                } else {
                    logger.log("🔄 Session revalidated, skipping data refresh");
                }
            } else if (event === "TOKEN_REFRESHED") {
                // Token refresh: Do nothing (or optionally refresh data silently)
                logger.log("🔄 Token refreshed silently");
            } else if (event === "SIGNED_OUT") {
                toast.info(t('toast.signedOut'));
                currentUserId.current = null;
                onSignOut();
                isInitialLoadRef.current = true; // Reset for next sign-in
            }
        });

        return () => subscription.unsubscribe();
    }, [setUser, onSignIn, onSignOut]); // Depends on stable callbacks

    const signInWithGoogle = async () => {
        logger.log("🚀 Starting Google sign in...");
        logger.log("🌍 Current URL:", window.location.href);
        logger.log("🌍 Origin:", window.location.origin);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        logger.log("📦 Sign in response data:", data);

        if (error) {
            logger.error("❌ Sign in error:", error);
            toast.error(t('toast.signInFailed', { error: error.message }));
        } else {
            logger.log("✅ Sign in initiated successfully");
            logger.log("🔗 Provider URL:", data?.url);
        }
    };

    const signOut = async () => {
        logger.log("🚪 Signing out...");
        try {
            const userId = currentUserId.current;
            // Attempt to sign out from Supabase
            const { error } = await supabase.auth.signOut();

            if (error) {
                // If error is "Auth session missing", it means we're already effectively signed out on the server
                if (error.message.includes("Auth session missing")) {
                    logger.warn("⚠️ Session already missing, proceeding with local cleanup");
                } else {
                    logger.error("❌ Sign out error:", error);
                }
            } else {
                logger.log("✅ Signed out successfully from server");
                if (userId) {
                    logAnalyticsEvent({ name: 'event_signout', params: { user_id: userId } });
                }
            }
        } catch (e) {
            logger.error("❌ Unexpected error during sign out:", e);
        } finally {
            // Force local cleanup regardless of server response
            logger.log("🧹 Performing local cleanup...");
            setUser(null);
            currentUserId.current = null;
            onSignOut();
            isInitialLoadRef.current = true;
            toast.info(t('toast.signedOut'));
        }
    };

    return { signInWithGoogle, signOut };
};
