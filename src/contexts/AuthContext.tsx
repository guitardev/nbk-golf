"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { isAdminUser } from '@/lib/admin';
import { Player } from '@/lib/googleSheets'; // We can import the type, but not the db logic

interface UserProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    memberProfile: Player | null;
    isAdmin: boolean;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [memberProfile, setMemberProfile] = useState<Player | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMemberProfile = async (lineUserId: string) => {
        try {
            const res = await fetch(`/api/profile?lineUserId=${lineUserId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.found) {
                    setMemberProfile(data.player);
                } else {
                    setMemberProfile(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch member profile", error);
        }
    };

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem("line_user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            refreshAdminStatus(parsedUser.userId);
            fetchMemberProfile(parsedUser.userId);
        }
        setIsLoading(false);
    }, []);

    const checkAdmin = (userId: string) => {
        setIsAdmin(isAdminUser(userId));
    };
    const refreshAdminStatus = (userId: string) => {
        setIsAdmin(isAdminUser(userId));
    };

    const login = () => {
        // Redirect to Line Login URL
        const clientID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
        const redirectURI = encodeURIComponent(`${window.location.origin}/api/auth/callback/line`);
        const state = "random_string"; // Should be generated randomly
        const scope = "profile openid";

        // For now, we'll just simulate login for development if no env vars
        if (!clientID) {
            console.warn("Line Client ID not found. Simulating login.");
            // Simulate Admin User for demo purposes if ID is "123"
            // Change ID to test non-admin: "user456"
            const mockUser = { userId: "123", displayName: "แอดมินสนาม" };
            setUser(mockUser);
            checkAdmin(mockUser.userId);
            localStorage.setItem("line_user", JSON.stringify(mockUser));
            fetchMemberProfile(mockUser.userId);
            return;
        }

        const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&state=${state}&scope=${scope}`;
        window.location.href = loginUrl;
    };

    const logout = () => {
        setUser(null);
        setMemberProfile(null);
        setIsAdmin(false);
        localStorage.removeItem("line_user");
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchMemberProfile(user.userId);
        }
    };

    return (
        <AuthContext.Provider value={{ user, memberProfile, isAdmin, login, logout, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
