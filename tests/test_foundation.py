"""Unit tests for ShelfSense AI foundation components."""

import pytest
from schemas import ProductScan, DateType
from scanner import scan_product
import inventory


def test_product_scan_defaults():
    """Verify that ProductScan defaults are initialized cleanly to None/Unknown."""
    scan = ProductScan()
    assert scan.product_name is None
    assert scan.brand is None
    assert scan.batch_number is None
    assert scan.manufacturing_date_text is None
    assert scan.printed_date_text is None
    assert scan.date_type == DateType.UNKNOWN
    assert scan.net_quantity is None
    assert scan.unit is None
    assert scan.storage_instructions is None
    assert scan.warnings is None
    assert scan.confidence_notes is None


def test_product_scan_with_values():
    """Verify ProductScan with populated values."""
    scan = ProductScan(
        product_name="Organic Oat Milk",
        brand="PureOat",
        batch_number="LOT-2026-X14",
        manufacturing_date_text="12/01/2026",
        printed_date_text="12/07/2026",
        date_type=DateType.BEST_BEFORE,
        net_quantity="1",
        unit="L",
        storage_instructions="Store in refrigerator after opening",
        warnings="Contains gluten",
    )
    assert scan.product_name == "Organic Oat Milk"
    assert scan.brand == "PureOat"
    assert scan.date_type == DateType.BEST_BEFORE
    assert scan.unit == "L"


def test_scanner_raises_not_implemented():
    """Verify scanner placeholder raises NotImplementedError with guidance message."""
    with pytest.raises(NotImplementedError) as exc_info:
        scan_product(b"dummy_image_data", "image/jpeg")
    assert "Member 2" in str(exc_info.value)


def test_scanner_empty_bytes_validation():
    """Verify scanner handles empty bytes with a ValueError."""
    with pytest.raises(ValueError) as exc_info:
        scan_product(b"", "image/jpeg")
    assert "Image bytes must not be empty" in str(exc_info.value)


def test_inventory_placeholders_raise_not_implemented():
    """Verify inventory placeholder functions raise descriptive NotImplementedError."""
    with pytest.raises(NotImplementedError):
        inventory.create_inventory_record({"product_name": "Milk"})

    with pytest.raises(NotImplementedError):
        inventory.get_inventory()

    with pytest.raises(NotImplementedError):
        inventory.update_stock_quantity(record_id=1, quantity_change=5)

    with pytest.raises(NotImplementedError):
        inventory.evaluate_expiry_risk(days_threshold=7)
