import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { SkeletonLine } from './Skeleton';
import '../styles/theme.css';

// Gates admin routes behind a Supabase session. Viewing routes never use this.
function RequireAuth({ children }) {
  // undefined = still resolving, null = signed out, object = session
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="memory-page">
        <div className="memory-card">
          <SkeletonLine width="45%" height={22} />
          <div style={{ height: 20 }} />
          <SkeletonLine />
          <SkeletonLine width="70%" />
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/admin/login" replace />;

  return children;
}

export default RequireAuth;
