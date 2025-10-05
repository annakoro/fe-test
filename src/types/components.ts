// Component Props Types

import { TokenData, SortConfig, FilterState } from './token';

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
  onFilterChange: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface StatusIndicatorProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  loading: boolean;
  error: string | null;
}

export interface LoadingStateProps {
  variant?: 'default' | 'inline' | 'overlay' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  rowCount?: number;
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  variant?: 'default' | 'inline' | 'banner';
  size?: 'small' | 'medium' | 'large';
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  showDismiss?: boolean;
  retrying?: boolean;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  variant?: 'default' | 'compact';
  size?: 'small' | 'medium' | 'large';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export interface PriceChangeIndicatorProps {
  value: number;
  showIcon?: boolean;
  showSign?: boolean;
  variant?: 'default' | 'bold' | 'subtle';
  size?: 'small' | 'medium' | 'large';
  decimals?: number;
  suffix?: string;
  className?: string;
}