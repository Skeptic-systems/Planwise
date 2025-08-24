import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';

export const ACCENT_COLORS = [
  { id: 'blue',   gradient: 'from-blue-500 to-blue-600',     text: 'text-blue-500',   hover: 'hover:text-blue-400' },
  { id: 'purple', gradient: 'from-purple-500 to-purple-600', text: 'text-purple-500', hover: 'hover:text-purple-400' },
  { id: 'orange', gradient: 'from-orange-500 to-orange-600', text: 'text-orange-500', hover: 'hover:text-orange-400' },
  { id: 'green',  gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-500', hover: 'hover:text-emerald-400' },
];

interface AccentColorContextType {
  accentColor: string;
  accentClasses: { text: string; gradient: string; hover: string };
  setAccentColor: (color: string) => Promise<void>;
}

const AccentColorContext = createContext<AccentColorContextType | undefined>(undefined);

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccentColor() {
      try {
        const { data: session } = await authClient.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          setAccentColorState(ACCENT_COLORS[0].id);
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('accent_color')
          .eq('id', userId)
          .single();

        setAccentColorState((profile?.accent_color as string) || ACCENT_COLORS[0].id);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccentColor();
  }, []);

  const setAccentColor = async (color: string) => {
    const { data: session } = await authClient.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    await supabase.from('profiles').update({ accent_color: color }).eq('id', userId);
    setAccentColorState(color);
  };

  if (isLoading) return <Skeleton className="h-6 w-24" />;

  const color = ACCENT_COLORS.find(c => c.id === (accentColor || ACCENT_COLORS[0].id)) || ACCENT_COLORS[0];
  const value: AccentColorContextType = {
    accentColor: color.id,
    accentClasses: { text: color.text, gradient: color.gradient, hover: color.hover },
    setAccentColor,
  };

  return <AccentColorContext.Provider value={value}>{children}</AccentColorContext.Provider>;
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext);
  if (!ctx) throw new Error('useAccentColor must be used within AccentColorProvider');
  return ctx;
}
