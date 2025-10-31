-- Create property_category dimension table
-- This is a lookup/reference table for property categories

CREATE TABLE IF NOT EXISTS property_category (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    icon VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_category_code ON property_category(code);
CREATE INDEX IF NOT EXISTS idx_property_category_active ON property_category(is_active);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_category_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_property_category_timestamp
BEFORE UPDATE ON property_category
FOR EACH ROW
EXECUTE FUNCTION update_property_category_timestamp();

-- Insert default categories
INSERT INTO property_category (code, name_ar, name_en, description, display_order, is_active) VALUES
('residential', 'سكني', 'Residential', 'العقارات السكنية مثل الشقق، الفلل، المنازل', 1, TRUE),
('commercial', 'تجاري', 'Commercial', 'العقارات التجارية مثل المحلات، المكاتب، المستودعات', 2, TRUE),
('investment', 'استثماري', 'Investment', 'العقارات الاستثمارية', 3, TRUE),
('agricultural', 'زراعي', 'Agricultural', 'الأراضي الزراعية والمزارع', 4, TRUE),
('industrial', 'صناعي', 'Industrial', 'العقارات الصناعية', 5, TRUE),
('land', 'أرض', 'Land', 'الأراضي الخام', 6, TRUE)
ON CONFLICT (code) DO NOTHING;

