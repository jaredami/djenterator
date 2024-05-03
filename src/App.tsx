import React from 'react';
import './App.scss';
import SequenceGenerator from './components/SequenceGenerator';
import { DrumsGenerator } from './generators/Drums';

const App: React.FC = () => {
  return (
    <div>
      <SequenceGenerator generator={DrumsGenerator} />
    </div>
  );
};

export default App;
