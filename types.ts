import type React from 'react';

export interface Tool {
  name: string;
  icon: React.ReactNode;
  component: React.FC;
  description: string;
}