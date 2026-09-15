import React from 'react';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { MoreClient } from '@/components/navigation/more-client';

export default async function MorePage() {
  const user = await enforceAdminPage();

  return (
    <MoreClient
      initialUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
