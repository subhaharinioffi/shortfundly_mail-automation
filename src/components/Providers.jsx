'use client';

import { SessionProvider } from 'next-auth/react';
import { RoleProvider } from '@/context/RoleContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <RoleProvider>
        {children}
      </RoleProvider>
    </SessionProvider>
  );
}
