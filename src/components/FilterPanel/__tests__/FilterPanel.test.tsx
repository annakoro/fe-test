import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FilterPanel } from '../FilterPanel';
import { filtersSlice } from '../../../store/slices/filtersSlice';

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      filters: filtersSlice.reducer,
    },
    preloadedState: {
      filters: {
        chain: null,
        minVolume: null,
        maxAge: null,
        minMarketCap: null,
        excludeHoneypots: false,
        ...initialState,
      },
    },
  });
};

const renderWithStore = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('FilterPanel', () => {
  it('renders all filter components', () => {
    renderWithStore(<FilterPanel />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Chain')).toBeInTheDocument();
    expect(screen.getByLabelText('Min Volume (USD)')).toBeInTheDocument();
    expect(screen.getByText('Max Age (hours)')).toBeInTheDocument();
    expect(screen.getByText('Min Market Cap (USD)')).toBeInTheDocument();
    expect(screen.getByText('Security Options')).toBeInTheDocument();
    expect(screen.getByText('Exclude honeypots')).toBeInTheDocument();
  });

  it('renders reset button', () => {
    renderWithStore(<FilterPanel />);
    
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    expect(resetButton).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    const initialState = {
      chain: 'ETH' as const,
      minVolume: 1000,
      maxAge: 24,
      minMarketCap: 10000,
      excludeHoneypots: true,
    };
    
    renderWithStore(<FilterPanel />, initialState);
    
    const chainSelect = screen.getByLabelText('Chain') as HTMLSelectElement;
    expect(chainSelect.value).toBe('ETH');
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    const ageSelect = screen.getByRole('combobox', { name: /max age/i }) as HTMLSelectElement;
    expect(ageSelect.value).toBe('24');
    const marketCapSelect = screen.getByRole('combobox', { name: /min market cap/i }) as HTMLSelectElement;
    expect(marketCapSelect.value).toBe('10000');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('handles reset button click', () => {
    const initialState = {
      chain: 'ETH' as const,
      minVolume: 1000,
      excludeHoneypots: true,
    };
    
    const { store } = renderWithStore(<FilterPanel />, initialState);
    
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);
    
    const state = store.getState();
    expect(state.filters).toEqual({
      chain: null,
      minVolume: null,
      maxAge: null,
      minMarketCap: null,
      excludeHoneypots: false,
    });
  });

  it('updates chain filter when changed', () => {
    const { store } = renderWithStore(<FilterPanel />);
    
    const chainSelect = screen.getByLabelText('Chain');
    fireEvent.change(chainSelect, { target: { value: 'SOL' } });
    
    const state = store.getState();
    expect(state.filters.chain).toBe('SOL');
  });

  it('updates volume filter when changed', () => {
    const { store } = renderWithStore(<FilterPanel />);
    
    const volumeInput = screen.getByLabelText('Min Volume (USD)');
    fireEvent.change(volumeInput, { target: { value: '5000' } });
    fireEvent.blur(volumeInput);
    
    const state = store.getState();
    expect(state.filters.minVolume).toBe(5000);
  });

  it('updates security filter when changed', () => {
    const { store } = renderWithStore(<FilterPanel />);
    
    const honeypotCheckbox = screen.getByRole('checkbox');
    fireEvent.click(honeypotCheckbox);
    
    const state = store.getState();
    expect(state.filters.excludeHoneypots).toBe(true);
  });
});