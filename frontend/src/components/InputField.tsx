import React from 'react';

interface InputFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: React.ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  placeholder = '',
  type = 'text',
  value,
  onChange,
  required = false,
  icon,
}) => {
  return (
    <div className="flex flex-col space-y-1">
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
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
};
