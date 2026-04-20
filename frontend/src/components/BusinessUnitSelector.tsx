// src/components/BusinessUnitSelector.tsx
import { useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import api from '../api/client';
import type { BusinessUnit } from '../types/BusinessUnit';

interface BusinessUnitSelectorProps {
  value: number | '';
  onChange: (id: number | '', bu: BusinessUnit | null) => void;
}

interface BusinessUnitListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BusinessUnit[];
}

export function BusinessUnitSelector({
  value,
  onChange,
}: BusinessUnitSelectorProps) {
  const [bus, setBus] = useState<BusinessUnit[]>([]);

  useEffect(() => {
    api
      .get<BusinessUnitListResponse>('business-units/', {
        params: {
          page: 1,
          page_size: 1000,
        },
      })
      .then((res) => setBus(res.data.results || []))
      .catch((err) => console.error('Error loading BUs', err));
  }, []);

  const handleChange = (event: any) => {
    const rawValue = event.target.value;
    const id = rawValue === '' ? '' : (rawValue as number);

    const buObj =
      id === ''
        ? null
        : bus.find((b) => b.id === id) ?? null;

    onChange(id, buObj);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="bu-label">Business Unit</InputLabel>
      <Select
        labelId="bu-label"
        label="Business Unit"
        value={bus.some((b) => b.id === value) ? value : ''}
        onChange={handleChange}
      >
        <MenuItem value="">
          <em>All BUs</em>
        </MenuItem>

        {bus.map((bu) => (
          <MenuItem key={bu.id} value={bu.id}>
            {bu.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
