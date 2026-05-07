import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ShortlistItem {
  id: string;
  institute: string;
  program: string;
  quota: string;
  seatType: string;
  gender: string;
  opening: number;
  closing: number;
  chance?: string;
  nirfOverall?: number | string;
  medianPackage?: number | string;
}

interface ShortlistContextType {
  shortlist: ShortlistItem[];
  addToShortlist: (item: ShortlistItem) => void;
  removeFromShortlist: (id: string) => void;
  isShortlisted: (id: string) => boolean;
  reorderShortlist: (startIndex: number, endIndex: number) => void;
  setShortlist: (list: ShortlistItem[]) => void;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('jee-shortlist');
    if (saved) {
      try {
        setShortlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse shortlist", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('jee-shortlist', JSON.stringify(shortlist));
  }, [shortlist]);

  const addToShortlist = (item: ShortlistItem) => {
    setShortlist(prev => [...prev, item]);
  };

  const removeFromShortlist = (id: string) => {
    setShortlist(prev => prev.filter(item => item.id !== id));
  };

  const isShortlisted = (id: string) => {
    return shortlist.some(item => item.id === id);
  };

  const reorderShortlist = (startIndex: number, endIndex: number) => {
    setShortlist(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  return (
    <ShortlistContext.Provider value={{ shortlist, setShortlist, addToShortlist, removeFromShortlist, isShortlisted, reorderShortlist }}>
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist() {
  const context = useContext(ShortlistContext);
  if (!context) {
    throw new Error('useShortlist must be used within a ShortlistProvider');
  }
  return context;
}
