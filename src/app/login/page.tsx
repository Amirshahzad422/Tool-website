'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaTools } from "react-icons/fa";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 shadow-xl rounded-2xl p-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="group flex items-center gap-3 font-bold tracking-tight text-2xl text-gray-900 hover:text-gray-700 transition-colors mb-6">
            <FaTools className="w-8 h-8 text-[#080c2a] group-hover:scale-110 transition-transform duration-200" />
            <span className="text-gray-900">Toolbox</span>
          </Link>
          
          <div className="mb-8">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-[#080c2a] hover:text-[#080c2a]/80 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#080c2a]/20 focus:border-[#080c2a] focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#080c2a]/20 focus:border-[#080c2a] focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#080c2a]/20 focus:border-[#080c2a] focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#080c2a] hover:bg-[#080c2a]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#080c2a] transition-colors"
            >
              {isLogin ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-[#080c2a] transition-colors"
            >
              Back to homepage
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
