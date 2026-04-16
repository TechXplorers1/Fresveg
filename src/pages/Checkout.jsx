import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle, MapPin, Package, Banknote, CreditCard, Smartphone, Check } from 'lucide-react';

export default function Checkout() {
  const { cartItems, address, getTotal, placeOrder } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState('Cash on Delivery');

  const PAYMENT_METHODS = [
    { id: 'cod', name: 'Cash on Delivery', icon: Banknote, desc: 'Pay when your order arrives' },
    { id: 'card', name: 'Debit/ Credit cards', icon: CreditCard, desc: 'Secure online payment' },
    { id: 'upi', name: 'UPI Payments', icon: Smartphone, desc: 'Pay via any UPI App' }
  ];

  const handleConfirmOrder = async () => {
    if (!address) {
      alert('Please select a delivery address in the cart first.');
      navigate('/cart');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      navigate('/');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Initiating order confirmation...');

      const orderId = await placeOrder(selectedPayment);

      if (orderId) {
        console.log('Order confirmed successfully:', orderId);
        alert('Order confirmed! Thank you for shopping with us.');
        navigate('/profile');
      } else {
        throw new Error('Order placement returned empty ID');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to place order. Please check your internet connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto text-green-500" size={64} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Checkout</h1>
          <p className="text-gray-600">Review your order and confirm</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Package className="text-brand" size={24} />
              <h2 className="text-xl font-semibold">Order Summary</h2>
            </div>
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity} × ${item.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-brand">${getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address & Payment */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="text-brand" size={24} />
                  <h2 className="text-xl font-semibold">Delivery Address</h2>
                </div>
                <button
                  onClick={() => navigate('/cart')}
                  className="text-xs font-bold text-gray-400 hover:text-brand transition-colors uppercase tracking-widest"
                >
                  Change
                </button>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                {address ? (
                  <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-line">
                    {address}
                  </p>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-red-500 font-bold mb-2">No Delivery Address Selected!</p>
                    <button
                      onClick={() => navigate('/cart')}
                      className="text-brand text-sm font-bold hover:underline"
                    >
                      Go back to Cart to select an address
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="text-brand" size={24} />
                <h2 className="text-xl font-semibold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.name)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${selectedPayment === method.name
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-50 hover:border-gray-100 bg-gray-50/50'
                      }`}
                  >
                    <div className={`p-3 rounded-xl transition-colors ${selectedPayment === method.name ? 'bg-brand text-white' : 'bg-white text-gray-400 group-hover:text-brand'
                      }`}>
                      <method.icon size={24} />
                    </div>
                    <div className="text-left flex-grow">
                      <p className={`font-bold transition-colors ${selectedPayment === method.name ? 'text-brand' : 'text-gray-900'}`}>
                        {method.name}
                      </p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                    {selectedPayment === method.name && (
                      <div className="bg-brand text-white p-1 rounded-full">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={isProcessing || cartItems.length === 0}
                className={`w-full py-4 px-4 rounded-2xl font-black transition-all mt-8 active:scale-[0.98] shadow-lg ${isProcessing || cartItems.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-brand hover:bg-brand-dark text-white'
                  }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2 italic">
                    <CheckCircle className="animate-pulse" size={20} /> Processing...
                  </span>
                ) : (
                  `Confirm order ${selectedPayment === 'Cash on Delivery' ? '(COD)' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
