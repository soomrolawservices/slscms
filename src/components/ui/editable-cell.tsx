import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X } from 'lucide-react';
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
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current && type !== 'select') {
      inputRef.current.focus();
    }
  }, [isEditing, type]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
    }
  };

  if (!isEditing) {
    if (type === 'select' && options.length > 0) {
      const option = options.find(o => o.value === value);
      return <span className={cn("capitalize", className)}>{option?.label || value || '-'}</span>;
    }
    return <span className={className}>{value || '-'}</span>;
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
        <SelectContent className="bg-popover border-2 border-border z-50">
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

  return (
    <div className="flex flex-wrap gap-1">
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
            "px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-all select-none",
            option.value === value
              ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
            isDragOver === option.value && option.value !== value && "ring-2 ring-primary/50 bg-primary/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
