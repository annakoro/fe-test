import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { FilterPanelDemo } from './FilterPanelDemo';
import { VirtualizedTableDemo } from './VirtualizedTableDemo';
import { SortingDemo } from './SortingDemo';
import { TableComponentsDemo } from './TableComponentsDemo';

const DemoApp: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'filter' | 'table' | 'sorting' | 'task10'>('task10');

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
            marginRight: '10px',
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
        <button 
          onClick={() => setActiveDemo('task10')}
          style={{ 
            backgroundColor: activeDemo === 'task10' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'task10' ? 'white' : 'black',
            border: '1px solid #ccc',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Task 10: Table Components
        </button>
      </nav>
      
      {activeDemo === 'filter' && <FilterPanelDemo />}
      {activeDemo === 'table' && <VirtualizedTableDemo />}
      {activeDemo === 'sorting' && <SortingDemo />}
      {activeDemo === 'task10' && <TableComponentsDemo />}
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