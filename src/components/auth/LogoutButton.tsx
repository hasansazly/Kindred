'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../../../utils/supabase/client';

export default function LogoutButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <button type="button" className={className} style={style} onClick={handleLogout}>
      {children ?? 'Log out'}
    </button>
  );
}
