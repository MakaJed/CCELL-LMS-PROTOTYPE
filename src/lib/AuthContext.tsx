import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  badges: any[];
  enrolledCourses?: string[];
  createdCourses?: string[];
}

interface AuthContextType {
  session: any | null;
  user: User | null;
  loading: boolean;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  signUpStudent: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  enrollInCourse: (courseId: string) => void;
  addCreatedCourse: (courseId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('ccell-user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setSession({ user: userData });
        // Refresh from backend in case DB was reset (non-blocking)
        fetch('/api/auth/me', {
          headers: { 'X-Mock-User-Id': userData.id, 'Content-Type': 'application/json' },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.user) {
              const refreshed = { ...userData, ...data.user };
              localStorage.setItem('ccell-user', JSON.stringify(refreshed));
              setUser(refreshed);
            }
          })
          .catch(() => {});
      } catch (error) {
        console.error('Error loading stored user:', error);
      }
    }
    setLoading(false);
  }, []);

  const signInWithCredentials = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const userData: User = { ...data.user, enrolledCourses: [], createdCourses: [] };
      localStorage.setItem('ccell-user', JSON.stringify(userData));
      setUser(userData);
      setSession({ user: userData });
    } finally {
      setLoading(false);
    }
  };

  const signUpStudent = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      const userData: User = { ...data.user, enrolledCourses: [], createdCourses: [] };
      localStorage.setItem('ccell-user', JSON.stringify(userData));
      setUser(userData);
      setSession({ user: userData });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('ccell-user');
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    const storedUser = localStorage.getItem('ccell-user');
    if (!storedUser) return;
    try {
      const userData = JSON.parse(storedUser);
      const res = await fetch('/api/auth/me', {
        headers: { 'X-Mock-User-Id': userData.id, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const refreshed = { ...userData, ...data.user };
        localStorage.setItem('ccell-user', JSON.stringify(refreshed));
        setUser(refreshed);
      } else {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const enrollInCourse = (courseId: string) => {
    if (user && user.role === 'student') {
      const updatedUser = {
        ...user,
        enrolledCourses: [...(user.enrolledCourses || []), courseId],
      };
      setUser(updatedUser);
      localStorage.setItem('ccell-user', JSON.stringify(updatedUser));
    }
  };

  const addCreatedCourse = (courseId: string) => {
    if (user && user.role === 'instructor') {
      const updatedUser = {
        ...user,
        createdCourses: [...(user.createdCourses || []), courseId],
      };
      setUser(updatedUser);
      localStorage.setItem('ccell-user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithCredentials, signUpStudent, signOut, refreshProfile, enrollInCourse, addCreatedCourse }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}