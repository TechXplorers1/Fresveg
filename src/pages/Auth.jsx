import React, { useState } from 'react';
import { User, ArrowRight, Lock, Mail, ShoppingBag, Store, AlertCircle, Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Auth() {
  const { login, register, loading, saveRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirect = redirectParam ? (redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`) : '/';

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: details, 2: role selection for signup
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'customer',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        // Login with email and password
        await login(formData.email, formData.password);
        navigate(redirect);
      } else {
        if (step === 1) {
          // Signup: Create account
          await register(formData.email, formData.password, `${formData.firstName} ${formData.lastName}`);
          setStep(2);
        } else if (step === 2) {
          // Save role and redirect to home
          await saveRole(formData.role);
          navigate(redirect);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              {isLogin ? 'Welcome Back' : (step === 1 ? 'Create Account' : 'Choose Role')}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin 
                ? 'Sign in to access your FresVeg account' 
                : (step === 1 ? 'Join FresVeg and start your journey' : 'Choose your role to get started')
              }
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200/60 rounded-2xl text-red-600 font-semibold text-xs text-left">
              {error}
            </div>
          )}

          <form className="space-y-5 text-left" onSubmit={handleSubmit}>
            {/* Step 1: Login or Signup Details */}
            {(isLogin || (!isLogin && step === 1)) && (
              <>
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 pl-1">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none text-sm" placeholder="John" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 pl-1">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none text-sm" placeholder="Doe" />
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 pl-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none text-sm" placeholder="john@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 pl-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none text-sm" placeholder="••••••••" />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Role Selection (Signup only) */}
            {!isLogin && step === 2 && (
              <div className="grid grid-cols-3 gap-3.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2.5 transition-all duration-300 ${
                    formData.role === 'customer' 
                      ? 'border-brand bg-brand-light/35 scale-[1.02] shadow-md shadow-brand/5' 
                      : 'border-gray-200/80 hover:border-brand/40 bg-white'
                  }`}
                >
                  <ShoppingBag size={24} className={formData.role === 'customer' ? 'text-brand' : 'text-gray-400'} />
                  <span className={`font-extrabold text-[10px] uppercase tracking-wide ${formData.role === 'customer' ? 'text-brand-dark' : 'text-gray-500'}`}>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'vendor' })}
                  className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2.5 transition-all duration-300 ${
                    formData.role === 'vendor' 
                      ? 'border-brand bg-brand-light/35 scale-[1.02] shadow-md shadow-brand/5' 
                      : 'border-gray-200/80 hover:border-brand/40 bg-white'
                  }`}
                >
                  <Store size={24} className={formData.role === 'vendor' ? 'text-brand' : 'text-gray-400'} />
                  <span className={`font-extrabold text-[10px] uppercase tracking-wide ${formData.role === 'vendor' ? 'text-brand-dark' : 'text-gray-500'}`}>Vendor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'delivery_person' })}
                  className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2.5 transition-all duration-300 ${
                    formData.role === 'delivery_person' 
                      ? 'border-brand bg-brand-light/35 scale-[1.02] shadow-md shadow-brand/5' 
                      : 'border-gray-200/80 hover:border-brand/40 bg-white'
                  }`}
                >
                  <Bike size={24} className={formData.role === 'delivery_person' ? 'text-brand' : 'text-gray-400'} />
                  <span className={`font-extrabold text-[10px] uppercase tracking-wide ${formData.role === 'delivery_person' ? 'text-brand-dark' : 'text-gray-500'}`}>Delivery</span>
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-brand/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm tracking-wide mt-2">
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : (step === 1 ? 'Continue' : 'Complete Signup'))} <ArrowRight size={16} />
            </button>
          </form>

          {step === 1 && (
            <div className="mt-8 text-center text-xs font-semibold text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); }} className="text-brand font-bold hover:underline">
                {isLogin ? 'Register now' : 'Sign in'}
              </button>
            </div>
          )}

          <div id="recaptcha-container"></div>
        </div>
      </div>
    </div>
  );
}
