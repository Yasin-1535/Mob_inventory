import React from 'react';
import { CheckCircle } from 'lucide-react';

interface RoleCardProps {
  role: 'admin' | 'vendor' | 'customer';
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: (role: 'admin' | 'vendor' | 'customer') => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  title,
  description,
  icon,
  selected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`flex flex-col items-center p-5 border rounded-lg w-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary hover:shadow-md ${selected ? 'border-primary bg-primary/5' : 'border-gray-300 bg-white'} `}
      aria-pressed={selected}
    >
      <div className="text-3xl mb-2 text-primary">{icon}</div>
      <h3 className="font-medium text-lg text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mt-1 text-center">{description}</p>
      {selected && (
        <CheckCircle className="absolute top-2 right-2 text-primary" size={20} />
      )}
    </button>
  );
};
