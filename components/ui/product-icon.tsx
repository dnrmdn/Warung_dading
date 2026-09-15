import React from 'react';
import {
  CupSoda,
  Soup,
  Cookie,
  Coffee,
  Egg,
  Flame,
  Wheat,
  Layers,
  Package,
} from 'lucide-react';

interface ProductIconProps {
  name?: string;
  className?: string;
}

export function ProductIcon({ name, className = 'w-5 h-5' }: ProductIconProps) {
  switch (name) {
    case 'CupSoda':
      return <CupSoda className={className} />;
    case 'Soup':
      return <Soup className={className} />;
    case 'Cookie':
      return <Cookie className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Egg':
      return <Egg className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Wheat':
      return <Wheat className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    default:
      return <Package className={className} />;
  }
}
