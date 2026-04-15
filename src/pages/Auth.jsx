import React, { useState } from 'react';
import { User, ArrowRight, Lock, Mail, ShoppingBag, Store, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const { login, register, loading, saveRole } = useAuth();
  const navigate = useNavigate();

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
        navigate('/');
      } else {
        if (step === 1) {
          // Signup: Create account
          await register(formData.email, formData.password, `${formData.firstName} ${formData.lastName}`);
          setStep(2);
        } else if (step === 2) {
          // Save role and redirect to home
          await saveRole(formData.role);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] bg-brand-light/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : (step === 1 ? 'Create Account' : 'Choose Role')}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin 
                ? 'Sign in to access your FresVeg account' 
                : (step === 1 ? 'Join FresVeg and start your journey' : 'Choose your role to get started')
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Step 1: Login or Signup Details */}
            {(isLogin || (!isLogin && step === 1)) && (
              <>
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none" placeholder="John" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none" placeholder="Doe" />
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none" placeholder="john@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none" placeholder="••••••••" />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Role Selection (Signup only) */}
            {!isLogin && step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    formData.role === 'customer' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand/50'
                  }`}
                >
                  <ShoppingBag size={32} className={formData.role === 'customer' ? 'text-brand' : 'text-gray-400'} />
                  <span className={`font-semibold ${formData.role === 'customer' ? 'text-brand' : 'text-gray-600'}`}>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'vendor' })}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    formData.role === 'vendor' ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand/50'
                  }`}
                >
                  <Store size={32} className={formData.role === 'vendor' ? 'text-brand' : 'text-gray-400'} />
                  <span className={`font-semibold ${formData.role === 'vendor' ? 'text-brand' : 'text-gray-600'}`}>Vendor</span>
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : (step === 1 ? 'Continue' : 'Complete Signup'))} <ArrowRight size={18} />
            </button>
          </form>

          {step === 1 && (
            <div className="mt-8 text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); }} className="text-brand font-semibold hover:underline">
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
