'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Implement password reset logic
    // For now, just show success message
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bug<span className="text-indigo-600">Snap</span>
          </h1>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        {isSubmitted ? (
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              <p className="font-medium">Check your email</p>
              <p className="text-sm mt-1">
                We've sent password reset instructions to {email}
              </p>
            </div>
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the email address associated with your account
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Send reset instructions
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}