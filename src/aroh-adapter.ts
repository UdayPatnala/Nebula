import { usePlatformStore } from "@aroh/asdk";
import type { UserProfile, UserRole } from "./types/auth";
import { getStorageLimitForRole } from "./config/roles";

// Maps AROH levels to Nebula's RBAC roles
export function mapArohLevelToNebulaRole(membershipLevel: string, userRole?: string): UserRole {
  if (userRole === "admin" || userRole === "operator") {
    return "administrator";
  }
  if (membershipLevel === "enterprise" || membershipLevel === "pro") {
    return "premium_user";
  }
  return "registered_user";
}

export function useArohNebulaBridge() {
  const {
    user: arohUser,
    profile: arohProfile,
    wallet: arohWallet,
    token,
    isAuthenticated,
    isLoading,
    login: arohLogin,
    logout: arohLogout,
    rewardUser
  } = usePlatformStore();

  const user: UserProfile | null = arohUser && arohProfile && arohWallet ? {
    id: arohUser.id,
    name: arohProfile.displayName,
    email: arohUser.email,
    role: mapArohLevelToNebulaRole(arohProfile.membershipLevel, arohUser.role),
    emailVerified: arohUser.emailVerified ?? false,
    credits: arohWallet.balance, // Sync credit balance with Aros wallet
    storageUsed: 0,
    storageLimit: getStorageLimitForRole(mapArohLevelToNebulaRole(arohProfile.membershipLevel, arohUser.role)),
    createdAt: arohUser.createdAt
  } : null;

  const login = async (email: string, password?: string) => {
    await arohLogin(email, password);
  };

  const logout = () => {
    arohLogout();
  };

  const updateCredits = async (amount: number) => {
    if (!arohUser) return;
    // Debits/Credits wallet: rewardUser accepts negative inputs for debit operations
    await rewardUser(arohUser.id, amount, "Nebula platform activity debit/credit");
  };

  const dailyCheckIn = async (): Promise<boolean> => {
    if (!arohUser) return false;
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem(`nebula_checkin_${arohUser.id}`);
    if (lastCheck === today) return false;

    await rewardUser(arohUser.id, 10, "Daily Check-in Reward");
    localStorage.setItem(`nebula_checkin_${arohUser.id}`, today);
    return true;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateCredits,
    dailyCheckIn,
    token
  };
}
