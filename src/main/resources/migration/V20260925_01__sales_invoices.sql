-- Internal sales documents, separate from fulfillment orders. No historical backfill.
IF OBJECT_ID('sales_invoice', 'U') IS NULL
BEGIN
    CREATE TABLE sales_invoice (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        order_id INT NOT NULL UNIQUE REFERENCES don_hang(ma_don_hang),
        issued_at DATETIME2 NOT NULL,
        issued_by NVARCHAR(255) NULL,
        issued_by_id INT NULL,
        customer_name NVARCHAR(255) NULL,
        order_code VARCHAR(255) NULL,
        order_type INT NULL,
        total DECIMAL(18,2) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'ISSUED',
        voided_at DATETIME2 NULL,
        voided_by NVARCHAR(255) NULL,
        voided_by_id INT NULL,
        void_reason NVARCHAR(500) NULL,
        print_count INT NOT NULL DEFAULT 0,
        header_snapshot NVARCHAR(MAX) NOT NULL
    );
END;
IF OBJECT_ID('sales_invoice_line', 'U') IS NULL
BEGIN
    CREATE TABLE sales_invoice_line (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        invoice_id BIGINT NOT NULL REFERENCES sales_invoice(id),
        product_code VARCHAR(255) NULL,
        sku VARCHAR(255) NULL,
        product_name NVARCHAR(500) NULL,
        variant_name NVARCHAR(500) NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(18,2) NOT NULL,
        amount DECIMAL(18,2) NOT NULL
    );
    CREATE INDEX ix_sales_invoice_line_invoice ON sales_invoice_line(invoice_id);
END;
