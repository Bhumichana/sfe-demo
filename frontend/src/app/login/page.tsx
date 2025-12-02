'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { DEMO_USERS } from '@/lib/constants';
import type { UserRole } from '@/types';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginDemo, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<'SR' | 'SM'>('SR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string>('');

  // Fetch company logo
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        // Fetch default company (first company in system)
        const response = await axios.get(`${apiUrl}/company/default/info`);
        if (response.data.logoUrl) {
          setCompanyLogo(response.data.logoUrl);
        }
      } catch (error) {
        console.error('Error fetching company logo:', error);
        // If error, use placeholder logo from Vercel Blob
        setCompanyLogo('https://kbiduzwyokfr2wr5.public.blob.vercel-storage.com/blank-bird-logo-design-idea-png-15.png');
      }
    };

    fetchCompanyLogo();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!username || !password) {
      return;
    }

    try {
      await login({ username, password });
      router.push('/');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleDemoLogin = async () => {
    clearError();
    const demoUser = selectedRole === 'SR' ? 'sales1' : 'manager';

    try {
      await loginDemo(demoUser);
      router.push('/');
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen gradient-gold flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg overflow-hidden">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company Logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SFE Mobile</h1>
          <p className="text-white/80">Sales Force Effectiveness</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Demo Mode Banner */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full bg-warning/10 border-2 border-warning rounded-xl p-3 mb-6 hover:bg-warning/20 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold text-warning">Demo Mode - Click to Login</span>
            </div>
          </button>

          {/* Role Selection Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('SR')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                selectedRole === 'SR'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Sales Rep
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('SM')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                selectedRole === 'SM'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Manager
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error rounded-xl text-error text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-muted border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 bg-muted border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
                <span className="text-sm text-foreground">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>

            {/* SSO Button */}
            <button
              type="button"
              disabled={isLoading}
              className="w-full py-3 px-4 border-2 border-border text-foreground font-medium rounded-xl hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign in with Google</span>
              </div>
            </button>
          </form>

          {/* Demo Accounts Info */}
          <div className="mt-6 p-4 bg-info/10 border border-info rounded-xl">
            <p className="text-xs text-info font-medium mb-2">Demo Accounts:</p>
            <div className="text-xs text-info/80 space-y-1">
              <p>• sales1 / demo1234 (Sales Rep)</p>
              <p>• manager / demo1234 (Manager)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Version 1.0.0 • 2025 SFE Mobile
        </p>
      </div>
    </div>
  );
}
