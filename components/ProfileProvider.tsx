'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

type Profile = {
    id: string;
    name: string;
    avatar_url: string | null;
};

type ProfileContextType = {
    currentProfile: Profile | null;
    switchProfile: (profile: Profile) => void;
    isLoading: boolean;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children, initialProfileId }: { children: React.ReactNode; initialProfileId?: string }) {
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // In a real app, we would fetch the full profile object based on ID, 
    // but for now we might need to rely on what we have or fetch it.
    // Ideally, layout passes the full profile? Or we fetch active profile client side.
    // Simpler: Just rely on cookie presence and let a component fetch details if needed, 
    // OR fetch all profiles and find the one matching the cookie.

    // Actually, to display the avatar in navbar immediately, we need the profile data.
    // Let's assume we can pass the initial profile object if known, or we fetch it.

    // For this 'super simple' requests, let's keep it simple:
    // We will persist the ID in cookie. The ProfileSwitcher will define the "Current Profile" object state.

    // WAIT, the ProfileSwitcher needs to know the profiles. 
    // Let's make the Context just hold the state and functions, and maybe trigger a re-verify.

    const switchProfile = (profile: Profile) => {
        Cookies.set('profile_id', profile.id.toString(), { expires: 365 });
        setCurrentProfile(profile);
        router.refresh(); // Refresh server components to pick up new cookie
    };

    useEffect(() => {
        // Determine initial state
        const profileId = Cookies.get('profile_id');
        if (profileId) {
            // We have an ID, but we need the name/avatar.
            // For now, we will wait for the switcher or layout to hydrate this, OR we can fetch it.
            // Since we want to be fast, maybe we don't block.
            // But the user wants seamless like Netflix.

            // Let's check session storage or just wait for the component to mount.
            // Better: We should probably fetch profiles in the switcher and set the current one there.
        }
        setIsLoading(false);
    }, []);

    return (
        <ProfileContext.Provider value={{ currentProfile, switchProfile, isLoading }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
