import React, { useState } from 'react';
import { FilterPanelDemo } from './demo/FilterPanelDemo';
import { VirtualizedTableDemo } from './demo/VirtualizedTableDemo';
import { SortingDemo } from './demo/SortingDemo';
import { TableComponentsDemo } from './demo/TableComponentsDemo';

function App() {
  const [activeDemo, setActiveDemo] = useState<'filter' | 'table' | 'sorting' | 'task10'>('task10');

  return (
    <div>
      <nav style={{ padding: '20px', borderBottom: '1px solid #ccc', backgroundColor: '#f8f9fa' }}>
        <button 
          onClick={() => setActiveDemo('task10')}
          style={{ 
            marginRight: '10px',
            backgroundColor: activeDemo === 'task10' ? '#007bff' : '#ffffff',
            color: activeDemo === 'task10' ? 'white' : 'black',
            border: '1px solid #007bff',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeDemo === 'task10' ? 'bold' : 'normal'
          }}
        >
          🚀 Task 10: Table Components
        </button>
        <button 
          onClick={() => setActiveDemo('filter')}
          style={{ 
            marginRight: '10px', 
            backgroundColor: activeDemo === 'filter' ? '#007bff' : '#ffffff',
            color: activeDemo === 'filter' ? 'white' : 'black',
            border: '1px solid #007bff',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeDemo === 'filter' ? 'bold' : 'normal'
          }}
        >
          Filter Panel Demo
        </button>
        <button 
          onClick={() => setActiveDemo('table')}
          style={{ 
            marginRight: '10px',
            backgroundColor: activeDemo === 'table' ? '#007bff' : '#ffffff',
            color: activeDemo === 'table' ? 'white' : 'black',
            border: '1px solid #007bff',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeDemo === 'table' ? 'bold' : 'normal'
          }}
        >
          Virtualized Table Demo
        </button>
        <button 
          onClick={() => setActiveDemo('sorting')}
          style={{ 
            backgroundColor: activeDemo === 'sorting' ? '#007bff' : '#ffffff',
            color: activeDemo === 'sorting' ? 'white' : 'black',
            border: '1px solid #007bff',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeDemo === 'sorting' ? 'bold' : 'normal'
          }}
        >
          Sorting Demo
        </button>
      </nav>
      
      {activeDemo === 'task10' && <TableComponentsDemo />}
      {activeDemo === 'filter' && <FilterPanelDemo />}
      {activeDemo === 'table' && <VirtualizedTableDemo />}
      {activeDemo === 'sorting' && <SortingDemo />}
    </div>
  );
}

export default App;