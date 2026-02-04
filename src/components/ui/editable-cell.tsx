import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  type?: 'text' | 'select' | 'email' | 'tel';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onMoveNext?: () => void;
  onMovePrev?: () => void;
}

export function EditableCell({
  value,
  onChange,
  isEditing,
  type = 'text',
  options = [],
  placeholder,
  className,
  disabled = false,
  onStartEdit,
  onCancelEdit,
  onMoveNext,
  onMovePrev,
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current && type !== 'select') {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, type]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
      onMoveNext?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(value);
      onCancelEdit?.();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleBlur();
      if (e.shiftKey) {
        onMovePrev?.();
      } else {
        onMoveNext?.();
      }
    }
  };

  const handleDoubleClick = () => {
    if (!disabled && !isEditing) {
      onStartEdit?.();
    }
  };

  if (!isEditing) {
    if (type === 'select' && options.length > 0) {
      const option = options.find(o => o.value === value);
      return (
        <span 
          className={cn("capitalize cursor-pointer hover:bg-muted/50 px-1 -mx-1 rounded transition-colors", className)}
          onDoubleClick={handleDoubleClick}
        >
          {option?.label || value || '-'}
        </span>
      );
    }
    return (
      <span 
        className={cn("cursor-pointer hover:bg-muted/50 px-1 -mx-1 rounded transition-colors", className)}
        onDoubleClick={handleDoubleClick}
      >
        {value || '-'}
      </span>
    );
  }

  if (type === 'select') {
    return (
      <Select
        value={localValue}
        onValueChange={(val) => {
          setLocalValue(val);
          onChange(val);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 w-full min-w-[100px]">
          <SelectValue placeholder={placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border z-50">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn("h-8", className)}
      disabled={disabled}
    />
  );
}

interface DraggableStatusProps {
  value: string;
  options: { value: string; label: string; color?: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DraggableStatus({ value, options, onChange, disabled }: DraggableStatusProps) {
  const [isDragOver, setIsDragOver] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, optionValue: string) => {
    e.dataTransfer.setData('text/plain', optionValue);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, optionValue: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(optionValue);
  };

  const handleDragLeave = () => {
    setIsDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetValue: string) => {
    e.preventDefault();
    setIsDragOver(null);
    if (!disabled && targetValue !== value) {
      onChange(targetValue);
    }
  };

  const getStatusColor = (optionValue: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-accent text-accent-foreground ring-2 ring-accent/50 shadow-sm';
    }
    return 'bg-muted/60 text-muted-foreground hover:bg-muted';
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <div
          key={option.value}
          draggable={!disabled && option.value === value}
          onDragStart={(e) => handleDragStart(e, option.value)}
          onDragOver={(e) => handleDragOver(e, option.value)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, option.value)}
          onClick={() => !disabled && onChange(option.value)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all select-none",
            getStatusColor(option.value, option.value === value),
            isDragOver === option.value && option.value !== value && "ring-2 ring-accent/50 bg-accent/10 scale-105",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
