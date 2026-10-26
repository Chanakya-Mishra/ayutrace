"""Shared Data Contracts for ShelfSense AI.

Module Owner: Project Lead (Member 1)

This module defines standard Pydantic models and data types used across modules
(scanner, inventory, ui).

Architectural Principles:
1. Label Facts vs. Inventory State:
   `ProductScan` models information observed directly on packaging (source-label facts).
   It is intentionally decoupled from warehouse/store inventory records (e.g., physical stock counts,
   shelf location, acquisition dates, or inventory movements).
2. Uncertainty Handling:
   Packaging often contains glare, tears, partial obscurities, or unconventional formatting.
   Fields that cannot be confidently extracted MUST remain None / Unknown rather than guessed.
3. Date Semantics:
   'Best Before' (quality threshold) and 'Expiry / Use By' (food safety threshold) are NOT equivalent.
   The schema treats them as distinct date types to inform downstream waste-reduction logic.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DateType(str, Enum):
    """Categorization of date markings found on consumer packaged goods.

    Distinct date semantics are critical for waste reduction:
    - EXPIRY / USE_BY: Strict safety cutoff. After this date, consuming the item may pose safety risks.
    - BEST_BEFORE: Quality threshold. The product remains safe to consume past this date if stored properly,
      though sensory qualities may degrade.
    - MANUFACTURING: Date of production or packaging.
    - UNKNOWN: The printed date label is ambiguous, illegible, or unspecified.
    """

    EXPIRY = "expiry_date"
    BEST_BEFORE = "best_before"
    USE_BY = "use_by"
    MANUFACTURING = "manufacturing_date"
    UNKNOWN = "unknown"


class ProductScan(BaseModel):
    """Data contract representing raw facts extracted from a product label scan.

    This model strictly captures what is visible on the package. It does NOT track
    current stock levels, warehouse locations, or retail pricing, which belong to
    the inventory domain.
    """

    product_name: Optional[str] = Field(
        default=None,
        description="Identified commercial name of the product from the label.",
    )
    brand: Optional[str] = Field(
        default=None,
        description="Brand name or manufacturer printed on the packaging.",
    )
    batch_number: Optional[str] = Field(
        default=None,
        description="Batch, lot, or run number printed on the package.",
    )
    manufacturing_date_text: Optional[str] = Field(
        default=None,
        description="Literal manufacturing or packaging date string as printed.",
    )
    printed_date_text: Optional[str] = Field(
        default=None,
        description="Literal expiry, use-by, or best-before date string as printed.",
    )
    date_type: Optional[DateType] = Field(
        default=DateType.UNKNOWN,
        description="Classification of the printed date (expiry vs. best-before vs. unknown).",
    )
    net_quantity: Optional[str] = Field(
        default=None,
        description="Net quantity stated on the package (e.g., '500', '1.5').",
    )
    unit: Optional[str] = Field(
        default=None,
        description="Unit of measurement printed on the package (e.g., 'g', 'kg', 'ml', 'L').",
    )
    storage_instructions: Optional[str] = Field(
        default=None,
        description="Storage requirements printed on label (e.g., 'Keep refrigerated at 4°C').",
    )
    warnings: Optional[str] = Field(
        default=None,
        description="Allergen notices, safety warnings, or advisory statements on packaging.",
    )
    confidence_notes: Optional[str] = Field(
        default=None,
        description="Notes regarding extraction certainty, blurred areas, or ambiguous fields.",
    )

    model_config = ConfigDict(use_enum_values=True, extra="ignore")
