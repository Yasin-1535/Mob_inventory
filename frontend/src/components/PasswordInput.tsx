import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  placeholder = '',
  value,
  onChange,
  required = false,
  icon,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col space-y-1 relative">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full ${icon ? 'pl-10' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};
