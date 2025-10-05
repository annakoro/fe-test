// Component Props Types

import { TokenData, SortConfig } from './token';

export interface VirtualizedTableProps {
  tokens: TokenData[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  onLoadMore: () => void;
  loading: boolean;
  error: string | null;
}

export interface TokenRowProps {
  token: TokenData;
  style?: React.CSSProperties;
}

export interface TableHeaderProps {
  columns: TableColumn[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: number;
}

export interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
  currentFilters: any;
}

export interface StatusIndicatorProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  loading: boolean;
  error: string | null;
}