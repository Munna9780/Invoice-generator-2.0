import React from 'react';
import type { InvoiceDesign } from '../types';
import { Layout } from 'lucide-react';

interface DesignPreviewProps {
  design: InvoiceDesign;
  isSelected: boolean;
  onSelect: (design: InvoiceDesign) => void;
}

export function DesignPreview({ design, isSelected, onSelect }: DesignPreviewProps) {
  return (
    <button
      onClick={() => onSelect(design)}
      className={`w-full p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      style={{
        background: `linear-gradient(135deg, ${design.secondaryColor}, white)`,
      }}
      aria-pressed={isSelected}
      aria-label={`Select ${design.name} design`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className="w-6 h-6 rounded-full shadow-sm"
            style={{ backgroundColor: design.primaryColor }}
            aria-hidden="true"
          />
          <h3 className="font-medium text-gray-900">{design.name}</h3>
        </div>
        <div className="flex space-x-1.5" aria-hidden="true">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: design.primaryColor }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: design.accentColor }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 line-clamp-2">{design.description}</p>
        <span className="text-xs font-medium px-2 py-1 rounded-full" 
          style={{
            backgroundColor: design.primaryColor,
            color: design.secondaryColor
          }}>
          {design.layout}
        </span>
      </div>
      
      <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full opacity-60"
            style={{ backgroundColor: i === 0 ? design.primaryColor : i === 1 ? design.accentColor : design.secondaryColor }}
          />
        ))}
      </div>
    </button>
  );
}