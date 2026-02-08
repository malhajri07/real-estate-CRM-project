SET search_path = public;

-- Create property_type table with relationship to property_category
-- This enables dynamic form selection: category -> types

CREATE TABLE IF NOT EXISTS property_type (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES property_category(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    icon VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique code within category
    UNIQUE(category_id, code)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_type_category ON property_type(category_id);
CREATE INDEX IF NOT EXISTS idx_property_type_active ON property_type(is_active);
CREATE INDEX IF NOT EXISTS idx_property_type_code ON property_type(code);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_type_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_property_type_timestamp
BEFORE UPDATE ON property_type
FOR EACH ROW
EXECUTE FUNCTION update_property_type_timestamp();

-- Insert property types for each category
-- Residential (سكني) types
INSERT INTO property_type (category_id, code, name_ar, name_en, description, display_order, is_active) VALUES
((SELECT id FROM property_category WHERE code = 'residential'), 'apartment', 'شقة', 'Apartment', 'شقة سكنية', 1, TRUE),
((SELECT id FROM property_category WHERE code = 'residential'), 'villa', 'فيلا', 'Villa', 'فيلا سكنية', 2, TRUE),
((SELECT id FROM property_category WHERE code = 'residential'), 'duplex', 'دوبلكس', 'Duplex', 'دوبلكس سكني', 3, TRUE),
((SELECT id FROM property_category WHERE code = 'residential'), 'townhouse', 'تاون هاوس', 'Townhouse', 'تاون هاوس', 4, TRUE),
((SELECT id FROM property_category WHERE code = 'residential'), 'studio', 'استوديو', 'Studio', 'استوديو سكني', 5, TRUE),
((SELECT id FROM property_category WHERE code = 'residential'), 'house', 'بيت', 'House', 'منزل', 6, TRUE),
((SELECT id FROM property_category WHERE code = 'residential'), 'building', 'عمارة', 'Building', 'عمارة سكنية', 7, TRUE)
ON CONFLICT (category_id, code) DO NOTHING;

-- Commercial (تجاري) types
INSERT INTO property_type (category_id, code, name_ar, name_en, description, display_order, is_active) VALUES
((SELECT id FROM property_category WHERE code = 'commercial'), 'office', 'مكتب', 'Office', 'مكتب تجاري', 1, TRUE),
((SELECT id FROM property_category WHERE code = 'commercial'), 'shop', 'محل', 'Shop', 'محل تجاري', 2, TRUE),
((SELECT id FROM property_category WHERE code = 'commercial'), 'warehouse', 'مستودع', 'Warehouse', 'مستودع', 3, TRUE),
((SELECT id FROM property_category WHERE code = 'commercial'), 'showroom', 'صالة عرض', 'Showroom', 'صالة عرض', 4, TRUE),
((SELECT id FROM property_category WHERE code = 'commercial'), 'commercial_building', 'عمارة تجارية', 'Commercial Building', 'عمارة تجارية', 5, TRUE)
ON CONFLICT (category_id, code) DO NOTHING;

-- Investment (استثماري) types
INSERT INTO property_type (category_id, code, name_ar, name_en, description, display_order, is_active) VALUES
((SELECT id FROM property_category WHERE code = 'investment'), 'residential_building', 'عمارة سكنية', 'Residential Building', 'عمارة للاستثمار السكني', 1, TRUE),
((SELECT id FROM property_category WHERE code = 'investment'), 'commercial_complex', 'مجمع تجاري', 'Commercial Complex', 'مجمع تجاري استثماري', 2, TRUE),
((SELECT id FROM property_category WHERE code = 'investment'), 'hotel', 'فندق', 'Hotel', 'فندق استثماري', 3, TRUE),
((SELECT id FROM property_category WHERE code = 'investment'), 'resort', 'منتجع', 'Resort', 'منتجع استثماري', 4, TRUE)
ON CONFLICT (category_id, code) DO NOTHING;

-- Agricultural (زراعي) types
INSERT INTO property_type (category_id, code, name_ar, name_en, description, display_order, is_active) VALUES
((SELECT id FROM property_category WHERE code = 'agricultural'), 'farm', 'مزرعة', 'Farm', 'مزرعة', 1, TRUE),
((SELECT id FROM property_category WHERE code = 'agricultural'), 'greenhouse', 'بيت محمي', 'Greenhouse', 'بيت محمي', 2, TRUE),
((SELECT id FROM property_category WHERE code = 'agricultural'), 'agricultural_land', 'أرض زراعية', 'Agricultural Land', 'أرض زراعية', 3, TRUE)
ON CONFLICT (category_id, code) DO NOTHING;

-- Industrial (صناعي) types
INSERT INTO property_type (category_id, code, name_ar, name_en, description, display_order, is_active) VALUES
((SELECT id FROM property_category WHERE code = 'industrial'), 'factory', 'مصنع', 'Factory', 'مصنع', 1, TRUE),
((SELECT id FROM property_category WHERE code = 'industrial'), 'industrial_warehouse', 'مستودع صناعي', 'Industrial Warehouse', 'مستودع صناعي', 2, TRUE),
((SELECT id FROM property_category WHERE code = 'industrial'), 'workshop', 'ورشة', 'Workshop', 'ورشة صناعية', 3, TRUE)
ON CONFLICT (category_id, code) DO NOTHING;

-- Land (أرض) types
INSERT INTO property_type (category_id, code, name_ar, name_en, description, display_order, is_active) VALUES
((SELECT id FROM property_category WHERE code = 'land'), 'vacant_land', 'أرض خالية', 'Vacant Land', 'أرض خالية', 1, TRUE),
((SELECT id FROM property_category WHERE code = 'land'), 'residential_land', 'أرض سكنية', 'Residential Land', 'أرض سكنية', 2, TRUE),
((SELECT id FROM property_category WHERE code = 'land'), 'commercial_land', 'أرض تجارية', 'Commercial Land', 'أرض تجارية', 3, TRUE),
((SELECT id FROM property_category WHERE code = 'land'), 'industrial_land', 'أرض صناعية', 'Industrial Land', 'أرض صناعية', 4, TRUE)
ON CONFLICT (category_id, code) DO NOTHING;

