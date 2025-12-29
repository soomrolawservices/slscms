import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineItem } from '@/hooks/useInvoiceLineItems';

interface InvoiceLineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
}

export function InvoiceLineItemsEditor({ items, onChange, disabled }: InvoiceLineItemsEditorProps) {
  const addItem = () => {
    onChange([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }
    
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Line Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground text-sm">No line items yet. Click "Add Item" to start.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1"></div>
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <Input
                className="col-span-5"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                disabled={disabled}
              />
              <Input
                className="col-span-2"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                disabled={disabled}
              />
              <Input
                className="col-span-2"
                type="number"
                min="0"
                value={item.unit_price}
                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                disabled={disabled}
              />
              <div className="col-span-2 font-medium text-sm px-2">
                PKR {item.amount.toLocaleString()}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1 h-8 w-8 text-destructive"
                onClick={() => removeItem(index)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex justify-end pt-2 border-t border-border">
            <div className="text-right">
              <span className="text-sm text-muted-foreground mr-4">Total:</span>
              <span className="font-bold text-lg">PKR {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
