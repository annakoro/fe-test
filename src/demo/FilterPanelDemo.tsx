import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FilterPanel } from '../components/FilterPanel/FilterPanel';
import { filtersSlice } from '../store/slices/filtersSlice';
import { useAppSelector } from '../store/hooks';
import { getFilterDescription, hasActiveFilters } from '../utils/filterValidation';

// Create a simple store for the demo
const demoStore = configureStore({
  reducer: {
    filters: filtersSlice.reducer,
  },
});

const FilterStatus: React.FC = () => {
  const filters = useAppSelector(state => state.filters);
  const hasFilters = hasActiveFilters(filters);
  const descriptions = getFilterDescription(filters);

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '16px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
        Current Filter State
      </h3>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Has Active Filters:</strong> {hasFilters ? 'Yes' : 'No'}
      </div>
      
      {descriptions.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <strong>Active Filters:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
            {descriptions.map((desc, index) => (
              <li key={index}>{desc}</li>
            ))}
          </ul>
        </div>
      )}
      
      <details style={{ marginTop: '12px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
          Raw Filter State (JSON)
        </summary>
        <pre style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: '#ffffff', 
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export const FilterPanelDemo: React.FC = () => {
  return (
    <Provider store={demoStore}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          marginBottom: '8px',
          color: '#2d3748'
        }}>
          Filter Panel Demo
        </h1>
        
        <p style={{ 
          color: '#718096', 
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          Test the filter components and see how they update the state in real-time.
        </p>
        
        <FilterPanel />
        
        <FilterStatus />
        
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#e6fffa', 
          borderRadius: '8px',
          border: '1px solid #81e6d9'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#234e52' }}>
            💡 How to test:
          </h3>
          <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: '#234e52' }}>
            <li>Select different chains from the dropdown</li>
            <li>Enter volume and market cap values</li>
            <li>Try the age filter presets and custom input</li>
            <li>Toggle the honeypot exclusion checkbox</li>
            <li>Use the Reset button to clear all filters</li>
            <li>Watch the filter state update in real-time below</li>
          </ul>
        </div>
      </div>
    </Provider>
  );
};