import React, { useEffect, useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ListInputProps {
    value: string; // Newline separated string
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export const ListInput: React.FC<ListInputProps> = ({
    value,
    onChange,
    placeholder = "Add item...",
    label,
}) => {
    // Parse initial value into array
    const [items, setItems] = useState<string[]>([]);

    useEffect(() => {
        setItems(value ? value.split("\n").map(s => s.trim()) : []);
    }, [value]);

    const updateItems = (newItems: string[]) => {
        setItems(newItems);
        onChange(newItems.join("\n"));
    };

    const handleAdd = () => {
        updateItems([...items, ""]);
    };

    const handleRemove = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        updateItems(newItems);
    };

    const handleChange = (index: number, val: string) => {
        const newItems = [...items];
        newItems[index] = val;
        updateItems(newItems);
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Input
                            value={item}
                            onChange={(e) => handleChange(index, e.target.value)}
                            placeholder={placeholder}
                            className="flex-1"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(index)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="w-full border-dashed"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
            </Button>
        </div>
    );
};
