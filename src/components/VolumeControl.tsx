import React, { memo, useCallback } from 'react';
import './VolumeControl.scss';

export const VolumeControl: React.FC<{
  label: string;
  value: number;
  onChange: (newVolume: number) => void;
}> = memo(({ label, value, onChange }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  return (
  <div className="volume-control">
    <label>{label}</label>
    <div className="volume-slider">
      <input
        type="range"
        min="-60"
        max="0"
        value={value}
        onChange={handleChange}
      />
      <div className="value">{value}</div>
    </div>
    </div>
  );
});

VolumeControl.displayName = 'VolumeControl';
