'use client';

import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
