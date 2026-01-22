import React from 'react';

export interface LayoutProps {
  children: React.ReactNode;
}

export enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}