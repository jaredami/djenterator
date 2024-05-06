import React from 'react';
import './App.scss';
import SequenceGenerator from './components/SequenceGenerator';
import { DrumGeneratorKeysArray, DrumsGenerator } from './generators/Drums';
import { GuitarGenerator, GuitarGeneratorKeysArray } from './generators/Guitar';

const App: React.FC = () => {
  return (
    <div>
      <SequenceGenerator
        generator={DrumsGenerator}
        keys={DrumGeneratorKeysArray}
      />
      <SequenceGenerator
        generator={GuitarGenerator}
        keys={GuitarGeneratorKeysArray}
      />
    </div>
  );
};

export default App;
