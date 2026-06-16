'use client';

import { useMaterialFamilies } from '@/services/queries';

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
};

export function MaterialFamilySelect({
  value,
  onChange,
  required = false,
  allowEmpty = true,
  emptyLabel = '-- None --',
  className = 'w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
}: Props) {
  const { data: families, isLoading } = useMaterialFamilies();

  return (
    <select
      required={required}
      className={className}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {isLoading && !families?.length && <option value="" disabled>Loading...</option>}
      {families?.map((f: { family_id: number; name: string }) => (
        <option key={f.family_id} value={f.name}>{f.name}</option>
      ))}
      {value && families && !families.some((f: { name: string }) => f.name === value) && (
        <option value={value}>{value}</option>
      )}
    </select>
  );
}
