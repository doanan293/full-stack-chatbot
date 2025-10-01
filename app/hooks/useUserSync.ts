import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import axios from "axios";

export const useUserSync = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const syncedRef = useRef(false);
    useEffect(() => {
        const syncUser = async () => {
            if (isLoaded && user && !syncedRef.current) {
                try {
                    const token = await getToken();
                    await axios.post(
                        "/api/user/sync",
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    syncedRef.current = true;
                } catch (error) {
                    console.error("Failed to sync user:", error);
                }
            } else if (isLoaded && !user) {
                // Reset sync status when user logs out
                syncedRef.current = false;
            }
        };

        syncUser();
    }, [user, isLoaded, getToken]);

    // Reset sync status when user changes (for account switching)
    useEffect(() => {
        syncedRef.current = false;
    }, [user?.id]);

    return { user, isLoaded };
};