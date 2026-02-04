import { useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToPDF, type ExportColumn } from '@/lib/export-utils';
import { toast } from '@/hooks/use-toast';
import { EditableCell, DraggableStatus } from './editable-cell';

export interface EditableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  editable?: boolean;
  editType?: 'text' | 'select' | 'email' | 'tel' | 'status';
  options?: { value: string; label: string; color?: string }[];
  render?: (row: T, isEditing: boolean) => React.ReactNode;
}

interface EditableDataTableProps<T> {
  data: T[];
  columns: EditableColumn<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  onUpdate?: (id: string, key: string, value: string) => Promise<void>;
  actions?: (row: T) => React.ReactNode;
  title?: string;
  isLoading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isUpdating?: boolean;
}

export function EditableDataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKey,
  pageSize = 10,
  onRowClick,
  onUpdate,
  actions,
  title = 'Data',
  isLoading = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  isUpdating = false,
}: EditableDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string; colIndex: number; rowIndex: number } | null>(null);

  // Build editable columns index for navigation
  const editableColumnIndices = useMemo(() => 
    columns.reduce((acc, col, idx) => {
      if (col.editable && col.editType !== 'status') {
        acc.push(idx);
      }
      return acc;
    }, [] as number[]),
  [columns]);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const allIds = data.map(item => item.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleCellUpdate = async (rowId: string, key: string, value: string) => {
    if (onUpdate) {
      try {
        await onUpdate(rowId, key, value);
        toast({ title: 'Updated', description: 'Field updated successfully' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to update field', variant: 'destructive' });
      }
    }
    setEditingCell(null);
  };

  // Filter data based on search
  const filteredData = searchKey
    ? data.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(search.toLowerCase())
      )
    : data;

  // Sort data
  const sortedData = sortKey
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortKey as keyof T];
        const bVal = b[sortKey as keyof T];
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: keyof T | string) => {
    if (sortKey !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Navigation helpers for keyboard shortcuts
  const moveToNextCell = useCallback((currentRowIndex: number, currentColIndex: number) => {
    const currentEditableIndex = editableColumnIndices.indexOf(currentColIndex);
    if (currentEditableIndex < editableColumnIndices.length - 1) {
      // Move to next column in same row
      const nextColIndex = editableColumnIndices[currentEditableIndex + 1];
      setEditingCell({ 
        rowId: paginatedData[currentRowIndex].id, 
        key: columns[nextColIndex].key as string,
        colIndex: nextColIndex,
        rowIndex: currentRowIndex
      });
    } else if (currentRowIndex < paginatedData.length - 1) {
      // Move to first editable column in next row
      const nextColIndex = editableColumnIndices[0];
      setEditingCell({ 
        rowId: paginatedData[currentRowIndex + 1].id, 
        key: columns[nextColIndex].key as string,
        colIndex: nextColIndex,
        rowIndex: currentRowIndex + 1
      });
    } else {
      setEditingCell(null);
    }
  }, [editableColumnIndices, paginatedData, columns]);

  const moveToPrevCell = useCallback((currentRowIndex: number, currentColIndex: number) => {
    const currentEditableIndex = editableColumnIndices.indexOf(currentColIndex);
    if (currentEditableIndex > 0) {
      // Move to prev column in same row
      const prevColIndex = editableColumnIndices[currentEditableIndex - 1];
      setEditingCell({ 
        rowId: paginatedData[currentRowIndex].id, 
        key: columns[prevColIndex].key as string,
        colIndex: prevColIndex,
        rowIndex: currentRowIndex
      });
    } else if (currentRowIndex > 0) {
      // Move to last editable column in prev row
      const prevColIndex = editableColumnIndices[editableColumnIndices.length - 1];
      setEditingCell({ 
        rowId: paginatedData[currentRowIndex - 1].id, 
        key: columns[prevColIndex].key as string,
        colIndex: prevColIndex,
        rowIndex: currentRowIndex - 1
      });
    } else {
      setEditingCell(null);
    }
  }, [editableColumnIndices, paginatedData, columns]);

  const handleExportCSV = () => {
    const exportColumns: ExportColumn<T>[] = columns.map(col => ({
      key: col.key as string,
      header: col.header,
    }));
    exportToCSV(sortedData as unknown as Record<string, unknown>[], exportColumns as ExportColumn<Record<string, unknown>>[], title.toLowerCase().replace(/\s+/g, '-'));
    toast({ title: 'Export successful', description: `${title} exported to CSV` });
  };

  const handleExportPDF = () => {
    const exportColumns: ExportColumn<T>[] = columns.map(col => ({
      key: col.key as string,
      header: col.header,
    }));
    exportToPDF(sortedData as unknown as Record<string, unknown>[], exportColumns as ExportColumn<Record<string, unknown>>[], title.toLowerCase().replace(/\s+/g, '-'), title);
  };

  const renderCell = (row: T, column: EditableColumn<T>, rowIndex: number, colIndex: number) => {
    const value = String(row[column.key as keyof T] ?? '');
    const isCurrentlyEditing = isEditMode || (editingCell?.rowId === row.id && editingCell?.key === column.key);

    // Status field with drag-drop
    if (column.editType === 'status' && column.options) {
      return (
        <DraggableStatus
          value={value}
          options={column.options}
          onChange={(newValue) => handleCellUpdate(row.id, column.key as string, newValue)}
          disabled={isUpdating}
        />
      );
    }

    // Custom render function
    if (column.render) {
      return column.render(row, isCurrentlyEditing);
    }

    // Editable fields
    if (column.editable && column.editType !== 'status') {
      return (
        <EditableCell
          value={value}
          onChange={(newValue) => handleCellUpdate(row.id, column.key as string, newValue)}
          isEditing={isCurrentlyEditing}
          type={column.editType || 'text'}
          options={column.options}
          disabled={isUpdating}
          onStartEdit={() => setEditingCell({ rowId: row.id, key: column.key as string, colIndex, rowIndex })}
          onCancelEdit={() => setEditingCell(null)}
          onMoveNext={() => moveToNextCell(rowIndex, colIndex)}
          onMovePrev={() => moveToPrevCell(rowIndex, colIndex)}
        />
      );
    }

    // Default display
    if (column.editType === 'select' && column.options) {
      return <span className="capitalize">{column.options.find(o => o.value === value)?.label || value || '-'}</span>;
    }
    return <span>{value || '-'}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="h-10 bg-muted animate-pulse rounded w-64" />
          <div className="flex gap-2">
            <div className="h-9 bg-muted animate-pulse rounded w-20" />
            <div className="h-9 bg-muted animate-pulse rounded w-20" />
          </div>
        </div>
        <div className="border-2 border-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse border-b border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search, Edit Mode Toggle, and Export */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {onUpdate && (
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsEditMode(!isEditMode);
                setEditingCell(null);
              }}
              className={cn(isEditMode && "bg-primary")}
            >
              {isEditMode ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Done Editing
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
          <Pencil className="h-4 w-4 text-primary" />
          <span className="text-primary font-medium">Edit Mode Active</span>
          <span className="text-muted-foreground">- Click any field to edit, drag status pills to update</span>
        </div>
      )}

      {/* Table - Desktop */}
      <div className="hidden md:block border-2 border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-border bg-muted/50">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.length > 0 && data.every(item => selectedIds.includes(item.id))}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    "font-bold text-foreground",
                    column.sortable && "cursor-pointer hover:bg-muted"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              {actions && <TableHead className="font-bold">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "border-b border-border",
                    !isEditMode && onRowClick && "cursor-pointer hover:bg-accent",
                    selectable && selectedIds.includes(row.id) && "bg-muted/50",
                    isEditMode && "bg-primary/5"
                  )}
                  onClick={() => !isEditMode && onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column, colIndex) => (
                    <TableCell key={String(column.key)} onClick={(e) => column.editable && e.stopPropagation()}>
                      {renderCell(row, column, rowIndex, colIndex)}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-border">
            No results found
          </div>
        ) : (
          paginatedData.map((row, rowIndex) => (
            <div
              key={row.id}
              className={cn(
                "border-2 border-border p-4 space-y-2 bg-card",
                !isEditMode && onRowClick && "cursor-pointer hover:shadow-sm",
                isEditMode && "bg-primary/5 border-primary/30"
              )}
              onClick={() => !isEditMode && onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <div key={String(column.key)} className="flex justify-between items-center" onClick={(e) => column.editable && e.stopPropagation()}>
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.header}
                  </span>
                  <span className="text-sm text-right">
                    {renderCell(row, column, rowIndex, colIndex)}
                  </span>
                </div>
              ))}
              {actions && (
                <div className="pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
