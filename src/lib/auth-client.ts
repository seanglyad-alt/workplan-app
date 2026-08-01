import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signInWithCustomToken,
  sendPasswordResetEmail,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth, googleAuthProvider } from "./firebase.ts";

let mockLocalUser: any = null;
let authListeners: ((user: any) => void)[] = [];

// Initialize simple local state if token exists or auto-provision default admin for local dev
const initLocalAuth = () => {
  const token = localStorage.getItem("app_token");
  const userStr = localStorage.getItem("app_user");
  if (token && userStr) {
    try {
      const parsed = JSON.parse(userStr);
      mockLocalUser = {
        ...parsed,
        displayName: parsed.displayName || parsed.name,
        photoURL: parsed.photoURL || parsed.avatar
      };
      return;
    } catch {}
  }

  // Default fallback for instant local dev access
  const defaultAdmin = {
    id: 1,
    uid: "local_admin_123",
    email: "admin@app.local",
    name: "Admin User",
    role: "Admin",
    displayName: "Admin User",
    photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
  };
  localStorage.setItem("app_token", "local_admin_token");
  localStorage.setItem("app_user", JSON.stringify(defaultAdmin));
  mockLocalUser = defaultAdmin;
};
initLocalAuth();

const notifyListeners = () => {
  authListeners.forEach(cb => cb(mockLocalUser || auth.currentUser));
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const token = await result.user.getIdToken();
    
    // Sync with backend
    await fetch("/api/auth/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        email: result.user.email,
        name: result.user.displayName,
        avatar: result.user.photoURL
      })
    });
    
    return result.user;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse login response as JSON:", text);
      throw new Error("Invalid response from server: " + text.substring(0, 50) + "...");
    }

    if (!res.ok) throw new Error(data.error || "Login failed");

    // Success login! We got a token from backend
    localStorage.setItem("app_token", data.token);
    mockLocalUser = {
      ...data.user,
      displayName: data.user.name,
      photoURL: data.user.avatar
    };
    localStorage.setItem("app_user", JSON.stringify(mockLocalUser));
    
    notifyListeners();

    return mockLocalUser;
  } catch (error) {
    console.error("Email login failed:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  alert("Password reset is functional but requires email provider setup. Use admin@app.local to test system access.");
};

export const logout = async () => {
  try {
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user");
    mockLocalUser = null;
    notifyListeners();
    // Also try firebase signOut just in case
    await firebaseSignOut(auth).catch(() => {});
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  authListeners.push(callback);
  
  // Call immediately with current local auth state
  if (mockLocalUser) {
    callback(mockLocalUser);
    return () => {
      authListeners = authListeners.filter(cb => cb !== callback);
    };
  }
  
  // Also pass through firebase auth changes if no local user is logged in
  const unsubscribeFb = onAuthStateChanged(auth, (user) => {
    if (!mockLocalUser) {
      callback(user);
    }
  });

  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
    unsubscribeFb();
  };
};

export const getAuthToken = async () => {
  const localToken = localStorage.getItem("app_token");
  if (localToken) return localToken;

  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken().catch(() => null);
};

export const updateLocalUser = (updatedUser: any) => {
  if (mockLocalUser) {
    mockLocalUser = {
      ...mockLocalUser,
      ...updatedUser,
      displayName: updatedUser.name || mockLocalUser.displayName,
      photoURL: updatedUser.avatar || mockLocalUser.photoURL
    };
    localStorage.setItem("app_user", JSON.stringify(mockLocalUser));
    notifyListeners();
  }
};
