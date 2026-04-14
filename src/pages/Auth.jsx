import React, { useState } from 'react';
import { User, Store, ArrowRight, Lock, Mail, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  
  // Registration steps: 1 = credentials, 2 = role
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer', // 'customer' or 'vendor'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      // Dummy login
      login({ name: formData.email.split('@')[0], email: formData.email, role: 'customer' });
      navigate('/');
    } else {
      if (step === 1) {
        setStep(2);
      } else if (step === 2) {
        finishSignup();
      }
    }
  };

  const finishSignup = () => {
    login({
      name: formData.name,
      email: formData.email,
      role: formData.role,
    });
    navigate('/');
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
              {isLogin ? 'Sign in to access your FresVeg account' : 'Join FresVeg and start your journey'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Login or Step 1 of Registration */}
            {(isLogin || (!isLogin && step === 1)) && (
              <>
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none" placeholder="Joe Doe" />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all outline-none" placeholder="joe@example.com" />
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

            {/* Step 2: Role Selection */}
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

            <button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              {isLogin ? 'Sign In' : (step === 1 ? 'Next' : 'Complete Signup')} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
             {isLogin ? "Don't have an account? " : "Already have an account? "}
             <button onClick={() => { setIsLogin(!isLogin); setStep(1); }} className="text-brand font-semibold hover:underline">
               {isLogin ? 'Register now' : 'Sign in'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
