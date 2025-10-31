-- Step 1: Create a sequence for the property ID counter
CREATE SEQUENCE IF NOT EXISTS property_id_seq START 1;

-- Step 2: Create the property_listings table
CREATE TABLE IF NOT EXISTS property_listings (
    id BIGSERIAL PRIMARY KEY,

    -- Custom formatted property ID (e.g., P-0000000001)
    property_id VARCHAR(20) UNIQUE NOT NULL DEFAULT (
        'P-' || LPAD(nextval('property_id_seq')::TEXT, 10, '0')
    ),

    -- Basic property details
    title VARCHAR(150) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL,
    listing_type VARCHAR(30) NOT NULL,

    -- Location details
    country VARCHAR(100) DEFAULT 'Saudi Arabia',
    region VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    street_address VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),

    -- Specifications
    bedrooms SMALLINT,
    bathrooms SMALLINT,
    living_rooms SMALLINT,
    kitchens SMALLINT,
    floor_number SMALLINT,
    total_floors SMALLINT,
    area_sq_m DECIMAL(10,2),
    building_year SMALLINT,

    -- Amenities
    has_parking BOOLEAN DEFAULT FALSE,
    has_elevator BOOLEAN DEFAULT FALSE,
    has_maids_room BOOLEAN DEFAULT FALSE,
    has_driver_room BOOLEAN DEFAULT FALSE,
    furnished BOOLEAN DEFAULT FALSE,
    balcony BOOLEAN DEFAULT FALSE,
    swimming_pool BOOLEAN DEFAULT FALSE,
    central_ac BOOLEAN DEFAULT FALSE,

    -- Financial details
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    payment_frequency VARCHAR(30),

    -- Media
    main_image_url TEXT,
    image_gallery TEXT[],
    video_clip_url TEXT,

    -- Contact
    contact_name VARCHAR(100),
    mobile_number VARCHAR(20) NOT NULL,

    -- Meta
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'Pending',

    -- Analytics
    views_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,

    -- Date tracking
    listed_date TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_listings_property_id ON property_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_property_listings_city ON property_listings(city);
CREATE INDEX IF NOT EXISTS idx_property_listings_region ON property_listings(region);
CREATE INDEX IF NOT EXISTS idx_property_listings_property_type ON property_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_property_listings_listing_type ON property_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_property_listings_status ON property_listings(status);
CREATE INDEX IF NOT EXISTS idx_property_listings_is_active ON property_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_property_listings_price ON property_listings(price);
CREATE INDEX IF NOT EXISTS idx_property_listings_listed_date ON property_listings(listed_date);

-- Step 4: Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_listings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_property_listings_timestamp
BEFORE UPDATE ON property_listings
FOR EACH ROW
EXECUTE FUNCTION update_property_listings_timestamp();

