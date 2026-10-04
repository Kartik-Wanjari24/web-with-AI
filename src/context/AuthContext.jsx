import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('as_auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate existing token on mount
  useEffect(() => {
    async function rehydrateSession() {
      const storedToken = localStorage.getItem('as_auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(storedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('as_auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('[AuthContext] Rehydration network check failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    rehydrateSession();
  }, []);

  /**
   * Request OTP for email
   */
  const sendOtp = async (email) => {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP code.');
    }
    return data;
  };

  /**
   * Verify OTP and log in
   */
  const verifyOtp = async (email, otp) => {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || 'Failed to verify OTP code.');
      error.attemptsRemaining = data.attemptsRemaining;
      error.locked = data.locked;
      throw error;
    }

    if (data.token && data.user) {
      localStorage.setItem('as_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  };

  /**
   * Sign out
   */
  const logout = async () => {
    try {
      if (user?.email) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        });
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('as_auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    sendOtp,
    verifyOtp,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
