import React from 'react';
import './App.scss';
import SequenceGenerator from './components/SequenceGenerator';
import { RhythmGeneratorKeysArray, RhythmGenerator } from './generators/Rhythm';
import { GuitarGenerator, GuitarGeneratorKeysArray } from './generators/Guitar';

const App: React.FC = () => {
  return (
      <SequenceGenerator
        generators={[RhythmGenerator, GuitarGenerator]}
        keys={[RhythmGeneratorKeysArray, GuitarGeneratorKeysArray]}
      />
  );
};

export default App;
