import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Zap,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { authService } from '../services/api';

// 1. PROFESSIONAL LOGIN PAGE
export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [quickLoginRole, setQuickLoginRole] = useState(null);

  // Quick Demo Autofill Helper
  const handleQuickFill = (role) => {
    setQuickLoginRole(role);
    setErrorMessage('');
    if (role === 'Admin') {
      setEmail('arul@brightloop.in');
      setPassword('Arul@12345');
    } else if (role === 'Staff') {
      setEmail('priya@brightloop.in');
      setPassword('Priya@12345');
    } else if (role === 'Customer') {
      setEmail('kavin@chennaitech.in');
      setPassword('Kavin@12345');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your corporate email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login({ email, password, rememberMe });
      if (res?.success && res.user) {
        if (res.accessToken) {
          localStorage.setItem('brightloop_token', res.accessToken);
        }
        localStorage.setItem('brightloop_auth_user', JSON.stringify(res.user));
        setUser(res.user);

        // Redirect based on role
        if (res.user.role === 'Customer') {
          navigate('/customer-portal', { replace: true });
        } else {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      } else {
        setErrorMessage(res?.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials or server unavailable. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1f132b] relative overflow-hidden">
      {/* Dynamic purple glow effects matching reference design */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8524E5]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#f2c400]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10">
        {/* Brand Logo & SaaS Tagline */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8524E5] to-[#f2c400] flex items-center justify-center shadow-xl shadow-[#8524E5]/40 mb-3">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
            BRIGHT<span className="text-[#f2c400]">LOOP</span>
          </h1>
          <p className="text-xs text-bright-textMuted mt-1">Enterprise Subscription Cloud</p>
        </div>

        {/* Demo Fast Account Switcher */}
        <div className="mb-5 p-2.5 rounded-2xl bg-black/30 border border-white/5">
          <span className="text-[10px] uppercase font-bold text-bright-textMuted block mb-1.5 text-center">
            Demo Credentials Quick Select
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            {[
              { role: 'Admin', name: 'Arul' },
              { role: 'Staff', name: 'Priya' },
              { role: 'Customer', name: 'Kavin' }
            ].map((btn) => (
              <button
                type="button"
                key={btn.role}
                onClick={() => handleQuickFill(btn.role)}
                className={`py-1.5 px-2 rounded-xl font-bold transition flex flex-col items-center border ${
                  quickLoginRole === btn.role
                    ? 'bg-bright-violet text-white border-bright-violet shadow'
                    : 'bg-white/5 text-bright-textMuted border-white/5 hover:border-white/15'
                }`}
              >
                <span>{btn.name}</span>
                <span className="text-[9px] opacity-75 font-normal">{btn.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meaningful Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-bright-textMuted mb-1 font-semibold">Corporate Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-bright-textMuted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                placeholder="name@brightloop.in"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-bright-textMuted font-semibold">Password</label>
              <Link to="/forgot-password" className="text-bright-violet hover:underline text-[11px]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-bright-textMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-bright-textMuted hover:text-white"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-bright-textMuted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-bright-violet focus:ring-0 bg-black/30 border-white/20"
              />
              <span>Remember this device</span>
            </label>
          </div>

          {/* Login Button with Loading State */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#8524E5]/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-bright-textMuted">
          Need a client account?{' '}
          <Link to="/signup" className="text-bright-yellow hover:underline font-bold">
            Create Customer Account
          </Link>
        </div>
      </div>
    </div>
  );
};

// 2. PROFESSIONAL SIGNUP PAGE (STRICT CUSTOMER ONLY)
export const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Real-time password strength checker
  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length > 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(form.password);
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400'];

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.termsAccepted) {
      setErrorMessage('You must accept the Terms and Conditions to register.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.signup(form);
      if (res?.success) {
        setSuccessInfo({
          email: form.email,
          debugToken: res.debugVerificationToken
        });
      } else {
        setErrorMessage(res?.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1f132b] relative overflow-hidden">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8524E5] to-[#f2c400] flex items-center justify-center shadow-lg shadow-[#8524E5]/40 mx-auto mb-2.5">
            <Zap className="text-white fill-white" size={20} />
          </div>
          <h2 className="text-2xl font-black text-white">Create Client Account</h2>
          <p className="text-xs text-bright-textMuted mt-1">
            Register for Brightloop Subscription Portal <span className="text-[#f2c400] font-semibold">(Customer Role)</span>
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successInfo ? (
          <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs space-y-4 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
            <div>
              <h4 className="text-base font-bold text-white">Registration Successful!</h4>
              <p className="text-xs mt-1 text-emerald-200/90">
                A verification link has been dispatched to <span className="font-bold text-white">{successInfo.email}</span>.
              </p>
            </div>

            {/* Instant Verification Shortcut for Local Testing */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-left">
              <span className="text-[10px] uppercase font-bold text-bright-textMuted block">Hackathon Fast-Verification Link:</span>
              <Link
                to={`/verify-email?token=${successInfo.debugToken}&email=${encodeURIComponent(successInfo.email)}`}
                className="text-xs text-bright-yellow hover:underline break-all font-mono mt-1 block"
              >
                Click here to verify email immediately →
              </Link>
            </div>

            <Link
              to="/login"
              className="inline-block px-6 py-2.5 rounded-full bg-bright-violet text-white font-bold text-xs"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-2.5 text-bright-textMuted" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                  placeholder="e.g. Kavin Kumar"
                />
              </div>
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-2.5 text-bright-textMuted" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                  placeholder="kavin@chennaitech.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-2.5 text-bright-textMuted" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                  placeholder="+91 98401 23456"
                />
              </div>
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-2.5 text-bright-textMuted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                  placeholder="Password@123"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-bright-textMuted hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {form.password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex justify-between text-[10px] text-bright-textMuted">
                    <span>Password Strength:</span>
                    <span className="font-bold text-white">{strengthLabels[strengthScore - 1] || 'Too Weak'}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-full ${
                          strengthScore >= lvl ? strengthColors[strengthScore - 1] : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-2.5 text-bright-textMuted" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
                  placeholder="Password@123"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-2.5 text-bright-textMuted hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <label className="flex items-start gap-2 cursor-pointer text-[11px] text-bright-textMuted pt-1">
              <input
                type="checkbox"
                required
                checked={form.termsAccepted}
                onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-bright-violet focus:ring-0 bg-black/30 border-white/20"
              />
              <span>I accept Brightloop's Terms & Conditions and Privacy Policy.</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#8524E5] hover:bg-[#7022B9] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#8524E5]/30 mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating Customer Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-xs text-bright-textMuted">
          Already have an account?{' '}
          <Link to="/login" className="text-bright-yellow hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

// 3. FORGOT PASSWORD WORKFLOW
export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugToken, setDebugToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setSubmitted(true);
      if (res.debugResetToken) {
        setDebugToken(res.debugResetToken);
      }
    } catch (err) {
      // Generic confirmation even on error to prevent user enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1f132b]">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
        <h2 className="text-2xl font-black text-white">Reset Account Password</h2>
        <p className="text-xs text-bright-textMuted mt-1 mb-6">
          Enter your registered email to receive secure password recovery instructions.
        </p>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs">
              If an account is associated with <span className="font-bold">{email}</span>, password reset instructions have been dispatched.
            </div>

            {debugToken && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-left text-xs">
                <span className="text-[10px] uppercase font-bold text-bright-textMuted block">Hackathon Reset Link Shortcut:</span>
                <Link
                  to={`/reset-password?token=${debugToken}&email=${encodeURIComponent(email)}`}
                  className="text-bright-yellow hover:underline break-all font-mono mt-1 block"
                >
                  Click here to set new password →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/15 text-white focus:outline-none focus:border-bright-violet"
              placeholder="name@brightloop.in"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-bright-violet hover:bg-bright-violetHover text-white font-bold disabled:opacity-50"
            >
              {loading ? 'Generating Reset Token...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        <div className="mt-6 text-xs text-bright-textMuted">
          <Link to="/login" className="text-white hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

// 4. RESET PASSWORD PAGE
export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const tokenFromUrl = queryParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword({
        token,
        newPassword,
        confirmNewPassword
      });

      if (res?.success) {
        setSuccess(true);
      } else {
        setErrorMessage(res?.message || 'Password reset failed.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Reset token expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1f132b]">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-black text-white text-center">Set New Password</h2>
        <p className="text-xs text-bright-textMuted mt-1 mb-6 text-center">
          Enter a strong, secure password for your Brightloop account.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-3">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
            <p>Your password has been reset successfully. All compromised sessions have been revoked.</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 rounded-full bg-bright-violet text-white font-bold"
            >
              Sign In with New Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 text-xs">
            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Security Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white font-mono text-[11px]"
                placeholder="Reset Token"
              />
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white"
                placeholder="NewPassword@123"
              />
            </div>

            <div>
              <label className="block text-bright-textMuted mb-1 font-semibold">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white"
                placeholder="NewPassword@123"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-bright-violet hover:bg-bright-violetHover text-white font-bold"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// 5. EMAIL VERIFICATION PAGE
export const VerifyEmail = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tokenFromUrl = queryParams.get('token') || '';
  const emailFromUrl = queryParams.get('email') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');

  const handleVerify = async (tokenToUse) => {
    setLoading(true);
    setStatus(null);

    try {
      const res = await authService.verifyEmail({ token: tokenToUse || token, email: emailFromUrl });
      if (res?.success) {
        setStatus('success');
        setMessage(res.message);
      } else {
        setStatus('error');
        setMessage(res.message || 'Verification failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Token expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1f132b]">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Email Verification</h2>
        <p className="text-xs text-bright-textMuted">
          Confirming account ownership for <span className="text-white font-semibold">{emailFromUrl || 'registered email'}</span>.
        </p>

        {status === 'success' ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
            <p>{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 rounded-full bg-bright-violet text-white font-bold"
            >
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300">
                {message}
              </div>
            )}

            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white font-mono text-[11px] text-center"
              placeholder="Paste verification token"
            />

            <button
              onClick={() => handleVerify(token)}
              disabled={loading || !token}
              className="w-full py-3 rounded-full bg-bright-violet hover:bg-bright-violetHover text-white font-bold disabled:opacity-50"
            >
              {loading ? 'Verifying Token...' : 'Verify Email Address'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
