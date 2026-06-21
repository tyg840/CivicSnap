import React, { useState } from "react";
import { Building2, LogIn, UserPlus, Info } from "lucide-react";
import { User } from "../types";
import { TORONTO_WARDS_25 } from "../wards";
import { isSupabaseConfigured, mapSupabaseUser, supabase } from "../supabase";

const configuredAppUrl = import.meta.env.VITE_APP_URL?.replace(/\/$/, "");
const getAuthRedirectUrl = () => configuredAppUrl || window.location.origin;

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  onCancel?: () => void;
}

export default function AuthComponent({ onAuthSuccess, onCancel }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup Form States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupWard, setSignupWard] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requireSupabase = () => {
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase Auth needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
      return null;
    }

    return supabase;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    const client = requireSupabase();
    if (!client) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      if (error) {
        throw error;
      }
      if (!data.user) {
        throw new Error("Supabase did not return a signed-in user.");
      }

      onAuthSuccess(mapSupabaseUser(data.user));
    } catch (error: any) {
      setErrorMsg(error.message || "Supabase login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupWard || !signupPassword) {
      setErrorMsg("Please provide all required registration fields.");
      return;
    }
    if (signupPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    const client = requireSupabase();
    if (!client) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const { data, error } = await client.auth.signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        options: {
          data: {
            full_name: signupName.trim(),
            ward: signupWard,
            bio: "",
            phone: "",
          },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      if (data.session && data.user) {
        onAuthSuccess(mapSupabaseUser(data.user));
      } else {
        setErrorMsg("Supabase created the account. Check your email to confirm before signing in.");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Supabase signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupabaseOAuth = async (provider: "google" | "apple") => {
    const client = requireSupabase();
    if (!client) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div id="auth-main-view" className="w-full flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-editorial-bg text-editorial-dark font-sans">
      
      {/* BRANDING PANEL: Left desktop-only branding banner */}
      <div 
        id="auth-branding-panel" 
        className="hidden md:flex md:w-1/2 relative bg-cover bg-center overflow-hidden flex-col justify-center items-center px-8 py-12 select-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAyVf2Q93UJf5JfeIqeU9DWNgwXf3GE8-ZLju9M8hlTlQDd1HJSAlKmPvaHNPE2B5J-OGv1gwhytM3MnmVIWcR2CPTcdlX3DDY3wEARc59R-nFjJF-ITfr7wv9MVi4XlDbJ5PknpMB9pWuOVArJEV4ljr8AXgORgisma90CWhrL8kGIGtcqaJfybVr3xUu8HN4BcoP08sVATqw4mohjiY7p29Tm4E9p5NVp5F5TQ7BIdXzQg8Y4lwdRg0JIEKCK6u6jL8_g9tBfn7s')`,
          filter: "saturate(0.4) contrast(1.1) brightness(0.85) sepia(0.05)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-editorial-dark via-editorial-dark/80 to-transparent z-10 opacity-90" />
        <div className="relative z-20 text-center max-w-sm flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-10 h-10 text-editorial-bg" />
            <h1 className="text-3xl font-serif font-bold text-editorial-bg uppercase italic tracking-tight">CivicSnap</h1>
          </div>
          <p className="text-editorial-bg/85 text-xs uppercase tracking-widest leading-relaxed font-bold font-sans">
            An independent crowdsourced visual gazette tracking community resolutions and street transparency across Toronto boroughs.
          </p>
        </div>
      </div>

      {/* FORM CORE PANEL: Right client-side login/signup switcher box */}
      <div id="auth-forms-panel" className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 py-8 sm:px-12 bg-editorial-bg">
        <div id="auth-form-card" className="w-full max-w-md bg-white border border-editorial-dark p-8 rounded-none shadow-none">
          
          <div className="text-center space-y-1 mb-6">
            <Building2 className="md:hidden w-8 h-8 text-editorial-dark mx-auto mb-2" />
            <h2 className="text-2xl font-serif font-bold uppercase tracking-tight text-editorial-dark leading-none">
              {activeTab === "login" ? "Verify Identity" : "Registry Access"}
            </h2>
            <p className="text-[10px] text-editorial-dark/50 font-bold uppercase tracking-widest pt-1">
              {activeTab === "login" ? "Access your municipal dashboard" : "Register to log live street concerns"}
            </p>
          </div>

          {/* Form Tabs Switcher */}
          <div id="auth-tab-bar" className="flex mb-6 border-b border-editorial-dark/15 text-sm font-semibold select-none">
            <button
              id="tab-login"
              onClick={() => {
                setActiveTab("login");
                setErrorMsg("");
              }}
              className={`flex-1 pb-2.5 transition-colors duration-150 border-b-2 text-center text-[10px] uppercase tracking-widest ${
                activeTab === "login"
                  ? "border-editorial-dark text-editorial-dark font-extrabold"
                  : "border-transparent text-editorial-dark/40 hover:text-editorial-dark"
              }`}
            >
              Log In
            </button>
            <button
              id="tab-signup"
              onClick={() => {
                setActiveTab("signup");
                setErrorMsg("");
              }}
              className={`flex-1 pb-2.5 transition-colors duration-150 border-b-2 text-center text-[10px] uppercase tracking-widest ${
                activeTab === "signup"
                  ? "border-editorial-dark text-editorial-dark font-extrabold"
                  : "border-transparent text-editorial-dark/40 hover:text-editorial-dark"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Validation Alert message display */}
          {errorMsg && (
            <div className="mb-4 bg-[#eff4ff] border border-editorial-dark text-editorial-dark px-3.5 py-2.5 text-xs leading-relaxed font-bold flex items-center gap-2 select-none">
              <Info className="w-4 h-4 shrink-0 text-editorial-dark" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LOGIN FORM DISPLAY */}
          {activeTab === "login" ? (
            <form id="form-login" onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40 hover:text-editorial-dark/60" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center select-none">
                  <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40 hover:text-editorial-dark/60" htmlFor="login-password">
                    Password
                  </label>
                  <a className="text-[9px] uppercase tracking-widest text-editorial-dark font-bold hover:opacity-65 border-b border-editorial-dark" href="#" onClick={(e) => e.preventDefault()}>
                    Forgot?
                  </a>
                </div>
                <input
                  id="login-password"
                  type="password"
                  className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-editorial-dark text-editorial-bg font-bold py-3.5 px-4 rounded-none border border-editorial-dark flex items-center justify-center gap-1.5 transition-all text-[10px] uppercase tracking-widest mt-4 cursor-pointer hover:bg-editorial-dark/95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Signing In" : "Sign In"}</span>
              </button>
            </form>
          ) : (
            /* SIGNUP SIGNUP REGISTRATION DISPLAY */
            <form id="form-signup" onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="signup-name">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none"
                  placeholder="Jane Doe"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="signup-email">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none"
                  placeholder="jane.doe@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="signup-ward">
                  Primary Ward
                </label>
                <select
                  id="signup-ward"
                  className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none font-bold"
                  value={signupWard}
                  onChange={(e) => setSignupWard(e.target.value)}
                  required
                >
                  <option value="" disabled>Select your ward</option>
                  {TORONTO_WARDS_25.map((ward) => (
                    <option key={ward.id} value={ward.label}>
                      {ward.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="signup-password">
                  Create Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <span className="text-[9px] text-editorial-dark/40 font-mono">Minimum 8 characters limit constraint.</span>
              </div>

              <button
                id="submit-signup-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-editorial-dark text-editorial-bg font-bold py-3.5 px-4 rounded-none border border-editorial-dark flex items-center justify-center gap-1.5 transition-all text-[10px] uppercase tracking-widest mt-4 cursor-pointer hover:bg-editorial-dark/95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Creating Account" : "Create Account"}</span>
              </button>
            </form>
          )}

          {/* Social connections separation bar */}
          <div id="auth-social-flow" className="mt-6 space-y-4 select-none">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-editorial-dark/15" />
              </div>
              <div className="relative flex justify-center text-xs font-semibold">
                <span className="px-3 bg-white text-editorial-dark/40 uppercase tracking-[0.2em] text-[8px]">Continue With OAuth</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSupabaseOAuth("google")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-editorial-dark bg-white hover:bg-editorial-subtle transition-colors cursor-pointer text-editorial-dark text-[9px] uppercase tracking-widest font-bold font-sans rounded-none disabled:opacity-60"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </button>
              
              <button 
                type="button"
                onClick={() => handleSupabaseOAuth("apple")}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-editorial-dark bg-white hover:bg-editorial-subtle transition-colors cursor-pointer text-editorial-dark text-[9px] uppercase tracking-widest font-bold font-sans rounded-none disabled:opacity-60"
              >
                <svg className="h-3.5 w-3.5 overlay-svg fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78.78-.04 1.94-.84 3.39-.71 1.5.15 2.66.75 3.36 1.8-3.14 1.86-2.58 5.76.35 6.94-.74 1.76-1.57 3.34-2.18 4.16zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"></path>
                </svg>
                Apple
              </button>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full mt-4 text-center text-[10px] text-editorial-dark/50 font-bold uppercase tracking-widest hover:text-editorial-dark select-none cursor-pointer pt-3 border-t border-editorial-dark/10"
            >
              Cancel / Return
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
