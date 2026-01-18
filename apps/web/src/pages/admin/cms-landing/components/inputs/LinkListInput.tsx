import React, { useEffect, useState } from "react";
import { Plus, X, GripVertical, Link as LinkIcon, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkItem {
    text: string;
    url: string;
}

interface LinkListInputProps {
    value: string; // Newline separated string "Text|URL"
    onChange: (value: string) => void;
    label?: string;
}

export const LinkListInput: React.FC<LinkListInputProps> = ({
    value,
    onChange,
    label,
}) => {
    const [items, setItems] = useState<LinkItem[]>([]);

    useEffect(() => {
        if (!value) {
            setItems([]);
            return;
        }
        const parsed = value.split("\n").map((line) => {
            const parts = line.split("|");
            return {
                text: parts[0]?.trim() || "",
                url: parts[1]?.trim() || "",
            };
        }).filter(i => i.text || i.url);

        // Only update state if length differs or content differs significantly to avoid cursor jumps
        // Simplification: just reset on external change for now (might cause cursor issues if parent updates frequently, but onChange updates parent)
        // To allow local editing without parent override interfering, we should track if local state is dirty? 
        // For now, simpler approach: synchronize.
        setItems(parsed);
    }, [value]);

    const emitChange = (newItems: LinkItem[]) => {
        // setItems(newItems); // Managed by parent prop update mostly, but for optimisitc UI:
        const stringVal = newItems.map(i => `${i.text}|${i.url}`).join("\n");
        onChange(stringVal);
    };

    const handleAdd = () => {
        const newItems = [...items, { text: "", url: "" }];
        emitChange(newItems);
    };

    const handleRemove = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        emitChange(newItems);
    };

    const handleChange = (index: number, field: keyof LinkItem, val: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: val };
        emitChange(newItems);
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start p-2 border rounded-md bg-slate-50/50">
                        <GripVertical className="h-4 w-4 mt-3 text-muted-foreground cursor-move opacity-50" />
                        <div className="flex-1 grid gap-2">
                            <div className="flex items-center gap-2">
                                <Type className="h-3 w-3 text-muted-foreground" />
                                <Input
                                    value={item.text}
                                    onChange={(e) => handleChange(index, "text", e.target.value)}
                                    placeholder="Link Text"
                                    className="h-8"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                <Input
                                    value={item.url}
                                    onChange={(e) => handleChange(index, "url", e.target.value)}
                                    placeholder="URL (#home, /login)"
                                    className="h-8"
                                />
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(index)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 mt-1"
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
                <Plus className="h-4 w-4" />
                Add Link
            </Button>
        </div>
    );
};
