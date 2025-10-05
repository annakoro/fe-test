import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { FilterPanelDemo } from './FilterPanelDemo';
import { VirtualizedTableDemo } from './VirtualizedTableDemo';
import { SortingDemo } from './SortingDemo';

const DemoApp: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'filter' | 'table' | 'sorting'>('sorting');

  return (
    <div>
      <nav style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
        <button 
          onClick={() => setActiveDemo('filter')}
          style={{ 
            marginRight: '10px', 
            backgroundColor: activeDemo === 'filter' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'filter' ? 'white' : 'black',
            border: '1px solid #ccc',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Filter Panel Demo
        </button>
        <button 
          onClick={() => setActiveDemo('table')}
          style={{ 
            marginRight: '10px',
            backgroundColor: activeDemo === 'table' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'table' ? 'white' : 'black',
            border: '1px solid #ccc',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Virtualized Table Demo
        </button>
        <button 
          onClick={() => setActiveDemo('sorting')}
          style={{ 
            backgroundColor: activeDemo === 'sorting' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'sorting' ? 'white' : 'black',
            border: '1px solid #ccc',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sorting Demo
        </button>
      </nav>
      
      {activeDemo === 'filter' && <FilterPanelDemo />}
      {activeDemo === 'table' && <VirtualizedTableDemo />}
      {activeDemo === 'sorting' && <SortingDemo />}
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>
);