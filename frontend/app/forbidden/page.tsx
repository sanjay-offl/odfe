import React from 'react';
import Link from 'next/link';
import { LuShieldAlert } from 'react-icons/lu';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8E3D3] p-4 font-sans">
      <div className="glass-panel max-w-md text-center p-8 border border-red-500/20 bg-white/50 backdrop-blur-md rounded-2xl shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <LuShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Access Denied</h1>
        <p className="mb-8 text-gray-600">
          You do not have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        <Link 
          href="/"
          className="inline-flex w-full justify-center rounded-lg bg-[#B43C1E] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#9a3319] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B43C1E]"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
