-- ====================================================================
-- KRISHI SAATHI - SEED DATA (FERTILIZER PRODUCTS & TEST CATALOG)
-- Reference: Department of Fertilizers, Govt. of India (DBT Rates)
-- ====================================================================

-- 1. FERTILIZER PRODUCTS CATALOG
INSERT INTO fertilizer_products (id, product_name, generic_name, n_percent, p_percent, k_percent, other_nutrients, bag_size_kg, standard_price_inr, is_subsidized)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Neem Coated Urea', 'Urea', 46.0, 0.0, 0.0, 'Neem Oil 0.035%', 45.0, 266.50, true),
    ('a0000001-0000-0000-0000-000000000002', 'DAP (Di-Ammonium Phosphate)', 'DAP', 18.0, 46.0, 0.0, NULL, 50.0, 1350.00, true),
    ('a0000001-0000-0000-0000-000000000003', 'MOP (Muriate of Potash)', 'MOP', 0.0, 0.0, 60.0, NULL, 50.0, 1700.00, true),
    ('a0000001-0000-0000-0000-000000000004', 'SSP (Single Super Phosphate)', 'SSP', 0.0, 16.0, 0.0, 'Sulfur 11%', 50.0, 525.00, true),
    ('a0000001-0000-0000-0000-000000000005', 'NPK 10:26:26 Complex', 'Complex 10-26-26', 10.0, 26.0, 26.0, NULL, 50.0, 1470.00, true),
    ('a0000001-0000-0000-0000-000000000006', 'NPK 20:20:0:13 Ammonium Phosphate Sulphate', 'APS 20-20-0', 20.0, 20.0, 0.0, 'Sulfur 13%', 50.0, 1200.00, true),
    ('a0000001-0000-0000-0000-000000000007', 'Zinc Sulphate Monohydrate (33% Zn)', 'Zinc', 0.0, 0.0, 0.0, 'Zinc 33%, Sulfur 15%', 5.0, 350.00, false),
    ('a0000001-0000-0000-0000-000000000008', 'Farmyard Manure / Organic Compost (FYM)', 'Organic FYM', 0.5, 0.2, 0.5, 'Organic Matter 15%', 1000.0, 1500.00, false)
ON CONFLICT (product_name) DO UPDATE 
SET standard_price_inr = EXCLUDED.standard_price_inr,
    bag_size_kg = EXCLUDED.bag_size_kg;

-- 2. PRODUCT PRICES
INSERT INTO product_prices (product_id, state, price_inr, source_note)
SELECT id, 'ALL', standard_price_inr, 'Official DBT India Subsidized MRP'
FROM fertilizer_products
ON CONFLICT DO NOTHING;
