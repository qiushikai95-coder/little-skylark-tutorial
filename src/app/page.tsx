'use client';

import React, { useState, useEffect } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

export default function Home() {
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    initializePaddle({
      environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  const openCheckout = (priceId: string, productName: string) => {
    paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { productName },
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
          Master your skills with <span className="text-indigo-600">Little Skylark</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10">
          Unlock your potential with our premium tutorials. Designed for learners who demand excellence.
        </p>
        <button 
          onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors duration-200"
        >
          Get Started
        </button>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">Simple Pricing</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Basic</h3>
              <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$5.99</div>
              <ul className="mb-8 space-y-3 text-gray-600 dark:text-gray-400 text-center">
                <li>Essential Access</li>
                <li>Community Support</li>
                <li>Standard Content</li>
              </ul>
              <button
                onClick={() => openCheckout('REPLACE_WITH_BASIC_PRICE_ID', 'Basic')}
                disabled={!paddle}
                className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {!paddle ? 'Loading...' : 'Buy Basic'}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-indigo-600 rounded-2xl p-8 flex flex-col items-center relative shadow-xl transform scale-105">
              <div className="absolute top-0 -translate-y-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Pro</h3>
              <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$9.99</div>
              <ul className="mb-8 space-y-3 text-gray-600 dark:text-gray-400 text-center">
                <li>Full Access</li>
                <li>Priority Support</li>
                <li>Exclusive Content</li>
                <li>Lifetime Updates</li>
              </ul>
              <button
                onClick={() => openCheckout('REPLACE_WITH_PRO_PRICE_ID', 'Pro')}
                disabled={!paddle}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                 {!paddle ? 'Loading...' : 'Buy Pro'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</a>
          <a href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</a>
          <a href="/refund" className="hover:text-gray-900 dark:hover:text-white transition-colors">Refund Policy</a>
        </div>
        © {new Date().getFullYear()} Little Skylark Tutorial. All rights reserved.
      </footer>
    </div>
  );
}
