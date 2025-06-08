import React from 'react';
import './App.scss';
import SequenceGenerator from './components/SequenceGenerator';
import { DrumGeneratorKeysArray, DrumsGenerator } from './generators/Drums';
import { GuitarGenerator, GuitarGeneratorKeysArray } from './generators/Guitar';

const App: React.FC = () => {
  return (
      <SequenceGenerator
        generators={[DrumsGenerator, GuitarGenerator]}
        keys={[DrumGeneratorKeysArray, GuitarGeneratorKeysArray]}
      />
  );
};

export default App;
