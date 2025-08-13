import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Edit, Eye, Plus, Bed, Bath, Square } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PropertyMap } from "@/components/ui/property-map";
import AddPropertyModal from "@/components/modals/add-property-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Property } from "@shared/schema";

export default function Properties() {
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: searchResults } = useQuery<Property[]>({
    queryKey: ["/api/properties/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/properties/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery.trim(),
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم حذف العقار بنجاح" });
    },
    onError: () => {
      toast({ 
        title: "خطأ", 
        description: "فشل في حذف العقار",
        variant: "destructive" 
      });
    },
  });

  const displayProperties = searchQuery.trim() ? searchResults : properties;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "sold": return "bg-blue-100 text-blue-800";
      case "withdrawn": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      deletePropertyMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500">جار تحميل العقارات...</div>
      </div>
    );
  }

  return (
    <>
      <Header 
        title="العقارات" 
        onAddClick={() => setAddPropertyModalOpen(true)}
        onSearch={setSearchQuery}
        searchPlaceholder="البحث في العقارات بالعنوان أو الموقع أو النوع..."
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle>جميع العقارات ({displayProperties?.length || 0})</CardTitle>
              <Button onClick={() => setAddPropertyModalOpen(true)}>
                <Plus className="ml-2" size={16} />
                إضافة عقار
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!displayProperties || displayProperties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-500 mb-4">
                  {searchQuery ? "لا توجد عقارات تطابق بحثك." : "لا توجد عقارات. أضف أول عقار للبدء."}
                </div>
                {!searchQuery && (
                  <Button onClick={() => setAddPropertyModalOpen(true)}>
                    <Plus className="ml-2" size={16} />
                    إضافة أول عقار
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden border border-border rounded-2xl apple-shadow-large apple-transition hover:scale-[1.02]">
                      {property.photoUrl && (
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={property.photoUrl} 
                            alt={property.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg text-foreground line-clamp-1 tracking-tight">
                            {property.title}
                          </h3>
                          <Badge className={`${getStatusBadgeColor(property.status)} rounded-full px-3 py-1 text-xs font-medium`}>
                            {property.status}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-4">
                          {property.address}, {property.city}, {property.state}
                        </p>
                        
                        {/* Property Location Map with Marker */}
                        <div className="mb-4">
                          <PropertyMap
                            address={`${property.address}, ${property.city}, ${property.state}`}
                            latitude={property.latitude ? parseFloat(property.latitude) : undefined}
                            longitude={property.longitude ? parseFloat(property.longitude) : undefined}
                            className="h-32 w-full"
                            showLink={true}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                          {property.bedrooms && (
                            <div className="flex items-center space-x-1">
                              <Bed size={14} />
                              <span>{property.bedrooms}</span>
                            </div>
                          )}
                          {property.bathrooms && (
                            <div className="flex items-center space-x-1">
                              <Bath size={14} />
                              <span>{property.bathrooms}</span>
                            </div>
                          )}
                          {property.squareFeet && (
                            <div className="flex items-center space-x-1">
                              <Square size={14} />
                              <span>{property.squareFeet.toLocaleString()} sq ft</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-primary font-semibold text-lg">
                            <span>{formatCurrency(property.price)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(property.id)}
                              disabled={deletePropertyMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        {property.description && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {property.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddPropertyModal open={addPropertyModalOpen} onOpenChange={setAddPropertyModalOpen} />
    </>
  );
}
