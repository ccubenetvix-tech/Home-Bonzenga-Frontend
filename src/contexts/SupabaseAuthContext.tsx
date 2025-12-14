import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabaseAuth, User, RegisterData, mapSupabaseAuthError, delay } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabase";
import { mockAuth } from "@/lib/mockAuth";
import { supabaseConfig } from "@/config/supabase";
import { getApiUrl } from "@/config/env";

interface VendorData {
  id: string;
  shopName: string;
  status: string;
  emailVerified?: boolean;
  rejectionReason?: string | null;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
}

interface VendorRegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  shopName: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number | string;
  longitude?: number | string;
  servicesOffered?: string[];
  businessType?: string;
  yearsInBusiness?: string | number;
  numberOfEmployees?: string | number;
  operatingHours?: Record<string, { open: string; close: string }>;
}

interface AuthContextType {
  user: User | null;
  vendor: VendorData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  handleSignup: (provider: 'google' | 'email', email?: string, password?: string, userData?: RegisterData) => Promise<void>;
  registerVendorAccount: (payload: VendorRegistrationPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  redirectToDashboard: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshVendorData: () => Promise<void>;
}

export const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

const STATIC_ACCOUNTS: Array<{
  email: string;
  password: string;
  user: User;
  redirect: string;
  token: string;
}> = [
    {
      email: 'manager@homebonzenga.com',
      password: 'Manager@123',
      user: {
        id: 'manager-static-id',
        email: 'manager@homebonzenga.com',
        firstName: 'System',
        lastName: 'Manager',
        role: 'MANAGER',
        status: 'ACTIVE',
      },
      redirect: '/manager',
      token: 'static-manager-token',
    },
    {
      email: 'admin@homebonzenga.com',
      password: 'Admin@123',
      user: {
        id: 'admin-static-id',
        email: 'admin@homebonzenga.com',
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      redirect: '/admin',
      token: 'static-admin-token',
    },
  ];

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Choose auth service based on configuration
  const authService = supabaseConfig.isConfigured ? supabaseAuth : mockAuth;

  // Fetch vendor data for vendor users
  const fetchVendorData = async (userId: string) => {
    try {
      const response = await fetch(getApiUrl(`/auth/vendor-status/${userId}`));
      if (!response.ok) {
        setVendor(null);
        return;
      }

      const data = await response.json();
      if (!data?.success) {
        setVendor(null);
        return;
      }

      setVendor({
        id: userId,
        shopName: data.shopName || '',
        status: data.status,
        emailVerified: data.emailVerified,
        rejectionReason: data.rejectionReason || null
      });
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      setVendor(null);
    }
  };

  // Sync user to local database (non-blocking, fails gracefully)
  // NOTE: This is optional and only runs if the backend server is available
  // Since we're using Supabase as the primary database, this sync is disabled by default
  const syncUserToLocalDB = async (user: User) => {
    // Skip sync by default - only enable if explicitly configured
    // This prevents unnecessary connection attempts and warnings
    // Set REACT_APP_ENABLE_LOCAL_SYNC=true in .env to enable local DB sync
    const shouldSync = process.env.REACT_APP_ENABLE_LOCAL_SYNC === 'true';

    if (!shouldSync) {
      // Silently skip if sync is disabled (default behavior)
      return;
    }

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 second timeout

      const response = await fetch(`${BACKEND_URL}/api/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User synced to local database:', data.synced ? 'created' : 'already exists');
      } else {
        // Only log if it's not a connection error (those are expected)
        if (response.status !== 0) {
          console.debug('Local database sync returned status:', response.status);
        }
      }
    } catch (error) {
      // Fail silently - this is non-critical since Supabase is the primary database
      // Only log to debug level to avoid console noise
      if (process.env.NODE_ENV === 'development') {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          // Connection refused - expected if backend is not running
          console.debug('Local database sync unavailable (backend server not running - this is OK if using Supabase only)');
        } else if (error.name === 'AbortError') {
          console.debug('Local database sync timed out');
        } else {
          console.debug('Local database sync error (non-critical):', error);
        }
      }
    }
  };

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // FIRST check for static manager/admin tokens BEFORE any Supabase checks
        // This ensures static tokens are preserved even if Supabase checks fail
        const storedToken = localStorage.getItem('token');
        const staticAccount = STATIC_ACCOUNTS.find(acc => acc.token === storedToken);

        if (staticAccount) {
          // Restore static account user on page reload
          console.log('🔄 Restoring static account session:', staticAccount.user.email);
          setUser(staticAccount.user);
          setVendor(null);
          setIsLoading(false);
          return; // Exit early - static account is authenticated
        }

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 10000); // 10 second timeout
        });

        // Check for valid Supabase session (for Supabase auth)
        if (supabaseConfig.isConfigured) {
          const sessionPromise = authService.getCurrentSession();
          const sessionResult = await Promise.race([sessionPromise, timeoutPromise]).catch(() => ({ success: false, data: null })) as any;

          if (sessionResult?.success && 'data' in sessionResult && sessionResult.data) {
            // Valid Supabase session exists, proceed with user fetch
            try {
              const accessToken = sessionResult.data?.access_token;
              if (accessToken) {
                localStorage.setItem('token', accessToken);
              }
            } catch (e) {
              // non-fatal
            }

            const userPromise = authService.getCurrentUser();
            const userResult = await Promise.race([userPromise, timeoutPromise]).catch(err => {
              console.warn('User fetch timeout or error:', err);
              return { success: true, data: null };
            }) as any;

            if (userResult?.success && 'data' in userResult && userResult.data) {
              const userData = userResult.data as User;
              setUser(userData);

              // If user is a vendor, fetch vendor data
              if (userData.role === 'VENDOR' && userData.id) {
                fetchVendorData(userData.id);
              }

              // Sync user to local database (don't wait for this, doesn't block login)
              syncUserToLocalDB(userData).catch(() => {
                // Error already logged in syncUserToLocalDB
              });

              setIsLoading(false);
              return; // Exit early if we have valid session
            }
          }
        }

        // If no valid Supabase session and no static token, check localStorage for mock auth or backend login
        // But only if we're using mock auth or if there's no Supabase configured
        if (!supabaseConfig.isConfigured) {
          const storedUser = localStorage.getItem('user');
          const storedAccessToken = localStorage.getItem('accessToken') || storedToken;

          if (storedUser && storedAccessToken) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsLoading(false);

              // If user is a vendor, fetch vendor data
              if (userData.role === 'VENDOR' && userData.id) {
                fetchVendorData(userData.id).catch(() => { });
              }
              return; // Exit early if we have user from localStorage (mock auth only)
            } catch (e) {
              console.warn('Failed to parse stored user data:', e);
              localStorage.removeItem('user');
            }
          }
        } else {
          // Supabase is configured but no valid session found
          // Only clear Supabase-specific items, preserve static tokens
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // DO NOT remove 'token' - it may be a static manager/admin token
        }
      } catch (error) {
        console.warn('Error getting initial session (non-critical):', error);

        // Before clearing token, check if it's a static token
        const storedToken = localStorage.getItem('token');
        const staticAccount = STATIC_ACCOUNTS.find(acc => acc.token === storedToken);

        if (staticAccount) {
          // Preserve static account even on error
          console.log('🔄 Preserving static account session after error:', staticAccount.user.email);
          setUser(staticAccount.user);
          setVendor(null);
          setIsLoading(false);
          return;
        }

        // Clear user state on error (only if not a static token)
        setUser(null);
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        } catch { }
      } finally {
        // Always clear loading state
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen to auth state changes with error handling (only for Supabase)
    let subscription: any = null;
    if (supabaseConfig.isConfigured) {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Reduce noisy logs and avoid printing sensitive tokens
          if (import.meta.env.DEV) {
            console.log('Auth state changed:', event);
          }

          try {
            if (event === 'SIGNED_IN' && session) {
              // store token for backend API
              try { localStorage.setItem('token', session.access_token); } catch { }
              try {
                const userResult = await authService.getCurrentUser();
                if (userResult.success && 'data' in userResult && userResult.data) {
                  setUser(userResult.data);

                  // If user is a vendor, fetch vendor data
                  if (userResult.data.role === 'VENDOR' && userResult.data.id) {
                    fetchVendorData(userResult.data.id);
                  }

                  // Sync user to local database on sign in (don't wait)
                  syncUserToLocalDB(userResult.data).catch(() => {
                    // Error already logged in syncUserToLocalDB
                  });
                }
              } catch (fetchError) {
                console.warn('Failed to fetch user on sign in:', fetchError);
                // Don't block sign in, but log the error
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setVendor(null);
              try { localStorage.removeItem('token'); } catch { }
            } else if (event === 'TOKEN_REFRESHED' && session) {
              // Optionally refresh user data when token is refreshed
              try { localStorage.setItem('token', session.access_token); } catch { }
              try {
                const userResult = await authService.getCurrentUser();
                if (userResult.success && 'data' in userResult && userResult.data) {
                  setUser(userResult.data);
                }
              } catch (fetchError) {
                console.warn('Failed to refresh user data:', fetchError);
                // Don't block token refresh, just log
              }
            }
          } catch (error) {
            console.warn('Error handling auth state change:', error);
            // On error, clear user state to prevent stuck loading
            if (event === 'SIGNED_OUT' || !session) {
              setUser(null);
            }
          } finally {
            // Always clear loading state
            setIsLoading(false);
          }
        }
      );
      subscription = sub;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Validate and trim inputs
      const trimmedEmail = (email || '').trim();
      const trimmedPassword = (password || '').trim();

      if (!trimmedEmail) {
        throw new Error('Email is required');
      }

      if (!trimmedPassword || trimmedPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const staticAccount = STATIC_ACCOUNTS.find(
        account =>
          account.email.toLowerCase() === trimmedEmail.toLowerCase() &&
          account.password === trimmedPassword
      );

      if (staticAccount) {
        setUser(staticAccount.user);
        setVendor(null);
        try {
          localStorage.removeItem('supabase.accessToken');
        } catch {
          // ignore
        }
        try {
          localStorage.setItem('token', staticAccount.token);
        } catch {
          // ignore
        }
        toast.success('Login successful');
        navigate(staticAccount.redirect, { replace: true });
        return;
      }

      if (!supabaseConfig.isConfigured) {
        throw new Error('Supabase is not configured. Please contact support.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        throw new Error(mapSupabaseAuthError(error));
      }

      const authUser = data.user;
      if (!authUser) {
        throw new Error('Unable to sign in. Please try again.');
      }

      const userRole = authUser.user_metadata?.role || 'CUSTOMER';

      if (userRole === 'VENDOR') {
        const statusResponse = await fetch(getApiUrl(`/auth/vendor-status/${authUser.id}`));
        if (!statusResponse.ok) {
          await supabase.auth.signOut();
          throw new Error('We could not find a vendor profile linked to this account.');
        }

        const statusData = await statusResponse.json();
        if (statusData.success && statusData.status !== 'APPROVED') {
          await supabase.auth.signOut();
          const message = statusData.status === 'REJECTED'
            ? statusData.rejectionReason || 'Your vendor application has been rejected. Please contact support for more details.'
            : 'Your vendor account is pending manager approval.';
          throw new Error(message);
        }

        setVendor({
          id: authUser.id,
          shopName: statusData.shopName || '',
          status: statusData.status,
          emailVerified: statusData.emailVerified,
          rejectionReason: statusData.rejectionReason || null,
        });
      } else {
        setVendor(null);
      }

      if (data.session?.access_token) {
        localStorage.setItem('supabase.accessToken', data.session.access_token);
      }

      const appUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        firstName: authUser.user_metadata?.first_name || '',
        lastName: authUser.user_metadata?.last_name || '',
        role: userRole,
        status: 'ACTIVE',
        phone: authUser.user_metadata?.phone,
      };

      setUser(appUser);
      toast.success('Login successful');
      navigate(getDashboardPath(userRole), { replace: true });
    } catch (error: any) {
      const message = error?.message || 'Unable to sign in.';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signInWithGoogle();

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Google login failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Google OAuth will redirect to the callback URL
      // The actual login handling will be done in the callback
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signUp(data);

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Registration failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Check if email confirmation is required
      if ('data' in result && result.data) {
        if (result.data.session) {
          setUser(result.data.user);
          toast.success("Registration successful");
          const dashboardPath = getDashboardPath(result.data.user.role);
          navigate(dashboardPath);
        } else {
          toast.success("Registration successful! Please check your email to confirm your account.");
          navigate('/login');
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (provider: 'google' | 'email', email?: string, password?: string, userData?: RegisterData) => {
    setIsLoading(true);
    try {
      if (provider === 'google') {
        // Handle Google OAuth signup
        const result = await supabaseAuth.signInWithGoogle();

        if (!result.success) {
          const errorMessage = 'error' in result ? result.error : "Google signup failed";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        // Google OAuth will redirect to the callback URL
        // The actual signup handling will be done in the callback
        toast.success("Redirecting to Google...");
      } else {
        // Handle email/password signup
        if (!email || !password || !userData) {
          throw new Error("Email, password, and user data are required for email signup");
        }

        if (!supabaseConfig.isConfigured) {
          const response = await fetch(getApiUrl('/auth/register-customer'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              password,
              phone: userData.phone,
            }),
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            const message = data?.message || 'Registration failed';
            toast.error(message);
            throw new Error(message);
          }

          toast.success('Registration successful! Please sign in.');
          navigate('/login');
          return;
        }

        const result = await supabaseAuth.signUp(userData);

        if (!result.success) {
          const errorMessage = 'error' in result ? result.error : "Registration failed";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        // Check if email confirmation is required
        if ('data' in result && result.data) {
          if (result.data.session) {
            setUser(result.data.user);
            toast.success("Registration successful");
            const dashboardPath = getDashboardPath(result.data.user.role);
            navigate(dashboardPath);
          } else {
            toast.success("Registration successful! Please check your email to confirm your account.");
            navigate('/login');
          }
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerVendorAccount = async (payload: VendorRegistrationPayload) => {
    setIsLoading(true);
    try {
      if (!supabaseConfig.isConfigured) {
        throw new Error('Supabase is not configured. Please contact support.');
      }

      // Validate and trim email
      const trimmedEmail = (payload.email || '').trim();
      if (!trimmedEmail) {
        throw new Error('Email is required');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password
      const trimmedPassword = (payload.password || '').trim();
      if (!trimmedPassword || trimmedPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check for existing rate limit in localStorage BEFORE attempting signup
      // Supabase rate limits typically last 5-15 minutes
      const rateLimitKey = `supabase_rate_limit_${trimmedEmail.toLowerCase()}`;
      const rateLimitInfo = localStorage.getItem(rateLimitKey);

      if (rateLimitInfo) {
        try {
          const { timestamp, duration } = JSON.parse(rateLimitInfo);
          const now = Date.now();
          const timeRemaining = (timestamp + duration) - now;

          if (timeRemaining > 0) {
            const minutesRemaining = Math.ceil(timeRemaining / 60000);
            const secondsRemaining = Math.ceil((timeRemaining % 60000) / 1000);
            const message = minutesRemaining > 0
              ? `Too many registration attempts. Please wait ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} before trying again.`
              : `Too many registration attempts. Please wait ${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''} before trying again.`;
            throw new Error(message);
          } else {
            // Rate limit expired, clear it
            localStorage.removeItem(rateLimitKey);
          }
        } catch (e) {
          // If we can't parse the rate limit info, clear it and continue
          localStorage.removeItem(rateLimitKey);
        }
      }

      const { email, password, firstName, lastName, phone } = payload;

      // Attempt signup (no retries for rate limits as they're persistent)
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            role: 'VENDOR'
          }
        }
      });

      if (error) {
        // Check if it's a rate limit error (429)
        const isRateLimitError = error.status === 429 ||
          error.message?.toLowerCase().includes('too many') ||
          error.message?.toLowerCase().includes('rate limit');

        if (isRateLimitError) {
          // Store rate limit info in localStorage
          // Supabase typically rate limits for 5-15 minutes, we'll use 10 minutes as a safe default
          const rateLimitDuration = 10 * 60 * 1000; // 10 minutes
          const rateLimitData = {
            timestamp: Date.now(),
            duration: rateLimitDuration
          };

          try {
            localStorage.setItem(rateLimitKey, JSON.stringify(rateLimitData));
          } catch (e) {
            // If localStorage fails, continue anyway
            console.warn('Failed to store rate limit info:', e);
          }

          throw new Error('Too many registration attempts. Please wait 10 minutes before trying again.');
        }

        throw new Error(mapSupabaseAuthError(error));
      }

      // Clear rate limit on successful signup
      try {
        localStorage.removeItem(rateLimitKey);
      } catch (e) {
        // Ignore errors
      }

      const supabaseUserId = data.user?.id;
      if (!supabaseUserId) {
        throw new Error('We could not create your account. Please confirm your email and try again.');
      }

      // Wait a moment for user profile to be created by trigger
      await delay(1000);

      // Get the current authenticated user ID from the session
      // This ensures we use auth.uid() which is required for RLS policy
      const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();
      const authenticatedUserId = authUser?.id || supabaseUserId;
      const hasActiveSession = !!authUser && !getUserError;

      // Validate required fields for vendor insert
      if (!authenticatedUserId) {
        throw new Error('User ID is required to create vendor profile.');
      }
      if (!payload.shopName || !payload.shopName.trim()) {
        throw new Error('Shop name is required.');
      }

      // Prepare vendor insert payload matching the database schema exactly
      // Build minimal payload with only required fields, let database defaults handle the rest
      const vendorInsertPayload: Record<string, any> = {
        // Required fields - always included
        user_id: authenticatedUserId,
        shopname: payload.shopName.trim(),
        status: 'PENDING'  // Must be uppercase to match CHECK constraint
      };

      // Add numeric fields with defaults (required by schema)
      vendorInsertPayload.service_radius = 5;
      vendorInsertPayload.advance_booking = 7;
      vendorInsertPayload.cancellation = 24;

      // Add optional fields ONLY if they have actual values (not empty strings or zeros)
      // This prevents sending invalid data that violates NOT NULL constraints
      if (payload.description?.trim()) {
        vendorInsertPayload.description = payload.description.trim();
      }

      if (payload.address?.trim()) {
        vendorInsertPayload.address = payload.address.trim();
      }

      if (payload.city?.trim()) {
        vendorInsertPayload.city = payload.city.trim();
      }

      if (payload.state?.trim()) {
        vendorInsertPayload.state = payload.state.trim();
      }

      if (payload.zipCode?.trim()) {
        vendorInsertPayload.zip_code = payload.zipCode.trim();
      }

      // Include coordinates if they are valid numbers (0 is a valid value)
      const lat = payload.latitude != null && payload.latitude !== '' ? Number(payload.latitude) : null;
      const lng = payload.longitude != null && payload.longitude !== '' ? Number(payload.longitude) : null;

      if (lat != null && !isNaN(lat)) {
        vendorInsertPayload.latitude = lat;
      }

      if (lng != null && !isNaN(lng)) {
        vendorInsertPayload.longitude = lng;
      }

      // Try to insert vendor using the function first (bypasses RLS issues)
      // If function doesn't exist, fall back to direct insert (only if we have an active session)
      let vendorData = null;
      let vendorError = null;

      try {
        // Try using the function (more reliable for new signups, especially when no session exists)
        // This function bypasses RLS using SECURITY DEFINER
        // Only pass fields that exist in the payload to avoid undefined parameter errors
        const functionParams: Record<string, any> = {
          // p_user_id matches the function definition in Postgres (backend migration)
          p_user_id: authenticatedUserId,
          p_shopname: vendorInsertPayload.shopname,
          p_status: 'PENDING'  // Must be uppercase to match CHECK constraint
        };

        // Add optional parameters only if they exist in the payload
        if (vendorInsertPayload.description !== undefined) {
          functionParams.p_description = vendorInsertPayload.description;
        }
        if (vendorInsertPayload.address !== undefined) {
          functionParams.p_address = vendorInsertPayload.address;
        }
        if (vendorInsertPayload.city !== undefined) {
          functionParams.p_city = vendorInsertPayload.city;
        }
        if (vendorInsertPayload.state !== undefined) {
          functionParams.p_state = vendorInsertPayload.state;
        }
        if (vendorInsertPayload.zip_code !== undefined) {
          functionParams.p_zip_code = vendorInsertPayload.zip_code;
        }
        if (vendorInsertPayload.latitude !== undefined) {
          functionParams.p_latitude = vendorInsertPayload.latitude;
        }
        if (vendorInsertPayload.longitude !== undefined) {
          functionParams.p_longitude = vendorInsertPayload.longitude;
        }

        const { data: functionResult, error: functionError } = await supabase.rpc(
          'insert_vendor_for_new_user',
          functionParams
        );

        if (functionError) {
          console.warn('Function call failed, will try direct insert:', functionError);
          // If the error is about the table not existing, the function needs to be updated
          if (functionError.code === '42P01' && functionError.message?.includes('vendors')) {
            console.error('Database function needs to be updated. Please run the migration: FIX_VENDOR_FUNCTION_NOW.sql');
          }
        }

        if (!functionError && functionResult) {
          // Function worked, fetch the vendor data
          // Use the function result directly as the vendor ID
          const { data: fetchedVendor, error: fetchError } = await supabase
            .from('vendor')
            .select('*')
            .eq('id', functionResult)
            .single();

          if (!fetchError && fetchedVendor) {
            vendorData = fetchedVendor;
          } else {
            // If fetch fails, that's okay - the insert succeeded
            // Create a minimal vendor object from the function result
            vendorData = { id: functionResult, user_id: authenticatedUserId } as any;
          }
        } else if (hasActiveSession) {
          // Function doesn't exist or failed, try direct insert
          // Only do this if we have an active session (auth.uid() will be available)
          // IMPORTANT: Use authenticatedUserId which matches auth.uid() for RLS policy
          const { data: insertData, error: insertError } = await supabase
            .from('vendor')
            .insert(vendorInsertPayload)
            .select()
            .single();

          vendorData = insertData;
          vendorError = insertError;
        } else {
          // No active session and function failed - cannot insert
          // Provide helpful error message
          if (vendorError?.code === '42P01') {
            throw new Error('Database configuration issue detected. Please contact support or run the database migration.');
          }
          throw new Error('Unable to create vendor profile. Please try again or contact support.');
        }
      } catch (error: any) {
        vendorError = error;
      }

      if (vendorError) {
        // If vendor already exists, that's okay - just log it
        if (vendorError.code === '23505' || vendorError.message?.includes('duplicate') || vendorError.message?.includes('already exists')) {
          console.warn('Vendor record already exists for this user');
        } else {
          // Log detailed error for debugging
          console.error('Vendor insert error:', {
            error: vendorError,
            message: vendorError.message,
            code: vendorError.code,
            details: vendorError.details,
            hint: vendorError.hint,
            payload: vendorInsertPayload
          });
          // Provide more helpful error messages
          let errorMessage = vendorError.message || vendorError.details || 'Failed to save your vendor profile. Please try again.';

          if (vendorError.code === '42501') {
            errorMessage = 'Permission denied. Please ensure your database permissions are configured correctly.';
          } else if (vendorError.code === '42P01') {
            errorMessage = 'Database table not found. Please ensure all migrations have been run.';
          }

          throw new Error(errorMessage);
        }
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      toast.success('Your application has been submitted. Please watch your inbox for approval updates.');
      navigate('/login');
    } catch (error: any) {
      const message = error?.message || 'Something went wrong while submitting your application.';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // First, sign out from Supabase to clear session and cookies
      if (supabaseConfig.isConfigured) {
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (supabaseError) {
          console.warn('Supabase signOut error (non-critical):', supabaseError);
          // Continue with logout even if Supabase signOut fails
        }
      }

      // Also call the auth service signOut for mock auth fallback
      try {
        await authService.signOut();
      } catch (authError) {
        console.warn('Auth service signOut error (non-critical):', authError);
        // Continue with logout even if auth service signOut fails
      }

      // Clear all auth-related data from localStorage
      // Remove all possible auth-related keys
      const authKeys = ['user', 'accessToken', 'refreshToken', 'token', 'mock-user', 'mock-session'];
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors when removing items
        }
      });

      // Clear all sessionStorage items (Supabase may store session data here)
      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors
      }

      // Clear state
      setUser(null);
      setVendor(null);

      // Show success message
      toast.success("Logged out successfully");

      // Force a full page reload to ensure all state, cookies, and cached data is cleared
      // This is the most reliable way to ensure complete logout
      // Small delay to allow toast to display
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } catch (err: any) {
      console.error('Logout error:', err);
      // Clear everything even if logout fails
      setUser(null);
      setVendor(null);

      const authKeys = ['user', 'accessToken', 'refreshToken', 'token', 'mock-user', 'mock-session'];
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });

      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors
      }

      // Show error message but still logout
      toast.error("Logout completed with warnings");

      // Force reload even on error to ensure clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } finally {
      // Note: setIsLoading won't execute after window.location.href, but that's fine
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      // First check localStorage for user data (from backend login)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          return;
        } catch (e) {
          console.warn('Failed to parse stored user:', e);
        }
      }

      // Fallback to Supabase auth service
      const userResult = await authService.getCurrentUser();
      if (userResult.success && 'data' in userResult && userResult.data) {
        setUser(userResult.data);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Refresh token error:', err);
      // Don't clear user if stored in localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setUser(null);
      }
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setIsLoading(true);
    try {
      const result = await supabaseAuth.updateProfile(user.id, updates);

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Profile update failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if ('data' in result && result.data) {
        setUser(result.data);
        toast.success("Profile updated successfully");
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.resetPassword(email);

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Password reset failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (userRole?: string) => {
    // Normalize role to uppercase to handle case variations
    const role = (userRole || user?.role || '').toUpperCase();
    if (!role) return '/';

    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'MANAGER':
        return '/manager';
      case 'VENDOR':
        return '/vendor';
      case 'CUSTOMER':
      default:
        return '/customer';
    }
  };

  const redirectToDashboard = () => {
    const dashboardPath = getDashboardPath();
    navigate(dashboardPath);
  };

  const refreshVendorData = useCallback(async () => {
    if (user?.role === 'VENDOR' && user?.id) {
      await fetchVendorData(user.id);
    } else {
      setVendor(null);
    }
  }, [user?.role, user?.id]);

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        vendor,
        isLoading,
        login,
        loginWithGoogle,
        register,
        handleSignup,
        registerVendorAccount,
        logout,
        refreshToken,
        redirectToDashboard,
        updateProfile,
        resetPassword,
        refreshVendorData,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): AuthContextType => {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) {
    // During SSR or initial render, context might not be available yet
    // Return a safe default instead of throwing to prevent app crashes
    // Only log in development mode and only once to avoid console spam
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const hasWarned = (window as any).__supabaseAuthWarned;
      if (!hasWarned) {
        console.debug("useSupabaseAuth: Context not available yet (likely during initial render), using default values");
        (window as any).__supabaseAuthWarned = true;
      }
    }
    return {
      user: null,
      vendor: null,
      isLoading: true,
      login: async () => { throw new Error("Auth provider not available"); },
      loginWithGoogle: async () => { throw new Error("Auth provider not available"); },
      register: async () => { throw new Error("Auth provider not available"); },
      handleSignup: async () => { throw new Error("Auth provider not available"); },
      registerVendorAccount: async () => { throw new Error("Auth provider not available"); },
      logout: async () => { throw new Error("Auth provider not available"); },
      refreshToken: async () => { throw new Error("Auth provider not available"); },
      redirectToDashboard: () => { },
      updateProfile: async () => { throw new Error("Auth provider not available"); },
      resetPassword: async () => { throw new Error("Auth provider not available"); },
      refreshVendorData: async () => { },
    };
  }
  return ctx;
};
