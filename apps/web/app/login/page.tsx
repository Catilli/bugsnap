'use client';

import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/register"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
