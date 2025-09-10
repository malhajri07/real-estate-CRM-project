import { useState } from "react";
import PropertySearchMap from "@/components/PropertySearchMap";
import Header from "@/components/layout/header";

export default function SearchProperties() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <>
      <Header 
        title="البحث في العقارات" 
        onSearch={handleSearch}
        searchPlaceholder="ابحث عن عقار، مدينة، أو نوع العقار..."
      />
      
      <main className="flex-1 overflow-hidden bg-gradient-to-br from-green-50 to-slate-100" dir="rtl">
        <div className="h-[calc(100vh-8rem)] min-h-[520px]">
          <PropertySearchMap className="h-full w-full" searchQuery={searchQuery} />
        </div>
      </main>
    </>
  );
}
