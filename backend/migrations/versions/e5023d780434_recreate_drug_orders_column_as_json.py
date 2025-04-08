"""Recreate drug_orders column as JSON

Revision ID: e5023d780434
Revises: 39c9700a1335
Create Date: 2025-02-28 09:18:51.351959

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON  # Import JSON type

# revision identifiers, used by Alembic.
revision: str = 'e5023d780434'
down_revision: Union[str, None] = '39c9700a1335'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the existing column (removes old data)
    op.drop_column("pharmacy_records", "drug_orders")
    
    # Add new JSON column
    op.add_column("pharmacy_records", sa.Column("drug_orders", JSON, nullable=True))


def downgrade() -> None:
    # Drop the JSON column
    op.drop_column("pharmacy_records", "drug_orders")
    
    # Restore the column as TEXT (if needed)
    op.add_column("pharmacy_records", sa.Column("drug_orders", sa.Text(), nullable=True))
