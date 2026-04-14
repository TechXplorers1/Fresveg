import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle, MapPin, Package } from 'lucide-react';

export default function Checkout() {
  const { cartItems, address, getTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const handleConfirmOrder = () => {
    // Here you would typically process the payment and submit the order
    alert('Order confirmed! Thank you for shopping with us.');
    clearCart();
    navigate('/');
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

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="text-brand" size={24} />
              <h2 className="text-xl font-semibold">Delivery Address</h2>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 whitespace-pre-line">{address}</p>
            </div>

            {/* Payment Section - Placeholder */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-600">Cash on Delivery</p>
                <p className="text-sm text-gray-500">Pay when your order arrives</p>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-full font-semibold hover:bg-green-700 transition-colors mt-6"
            >
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}