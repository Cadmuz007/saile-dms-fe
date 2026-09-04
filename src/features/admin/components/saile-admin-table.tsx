"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState, type MRT_SortingState, type MRT_Updater, useMaterialReactTable } from "material-react-table";

const tableTheme = createTheme({
  palette: { primary: { main: "#810a6a" }, background: { default: "#f8fafc" } },
  shape: { borderRadius: 6 },
  typography: { fontFamily: "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 13 },
});

interface SaileAdminTableProps<TData extends object> {
  columns: MRT_ColumnDef<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  isLoading?: boolean;
  onPaginationChange: (updater: MRT_Updater<MRT_PaginationState>) => void;
  onSortingChange: (updater: MRT_Updater<MRT_SortingState>) => void;
  pagination: MRT_PaginationState;
  rowCount: number;
  sorting: MRT_SortingState;
}

/**
 * Shared admin table. Pagination and sorting state are controlled by the parent
 * so replacing mock data with a server query only requires wiring its callbacks.
 */
export function SaileAdminTable<TData extends object>({
  columns, data, getRowId, isLoading = false, onPaginationChange, onSortingChange, pagination, rowCount, sorting,
}: SaileAdminTableProps<TData>) {
  const table = useMaterialReactTable({
    columns,
    data,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableGlobalFilter: false,
    enableHiding: false,
    getRowId,
    manualPagination: true,
    manualSorting: true,
    muiBottomToolbarProps: { sx: { borderTop: "1px solid #e2e8f0" } },
    muiTableBodyCellProps: { sx: { borderColor: "#eef2f7", color: "#334155", py: 1.5 } },
    muiTableHeadCellProps: { sx: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#334155", fontWeight: 700, py: 1.4 } },
    muiTablePaperProps: { elevation: 0, sx: { border: "1px solid #e2e8f0", borderRadius: "6px", boxShadow: "0 1px 3px rgba(15,23,42,.04)", overflow: "hidden" } },
    onPaginationChange,
    onSortingChange,
    rowCount,
    state: { isLoading, pagination, sorting },
  });

  return <ThemeProvider theme={tableTheme}><MaterialReactTable table={table} /></ThemeProvider>;
}
