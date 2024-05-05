import React from 'react';
import './App.scss';
import SequenceGenerator from './components/SequenceGenerator';
import { DrumGeneratorKeysArray, DrumsGenerator } from './generators/Drums';

const App: React.FC = () => {
  return (
    <div>
      <SequenceGenerator
        generator={DrumsGenerator}
        keys={DrumGeneratorKeysArray}
      />
    </div>
  );
};

export default App;
