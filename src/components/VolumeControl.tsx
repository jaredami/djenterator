import './VolumeControl.scss';

export const VolumeControl: React.FC<{
  label: string;
  value: number;
  onChange: (newVolume: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="volume-control">
    <label style={{ color: 'white' }}>{label}</label>
    <input
      type="range"
      min="-60"
      max="0"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);
