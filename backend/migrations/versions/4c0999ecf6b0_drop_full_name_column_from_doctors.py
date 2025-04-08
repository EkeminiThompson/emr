from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '4c0999ecf6b0'
down_revision = '717c01782bfc'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Get the table's current columns
    inspector = inspect(op.get_bind())
    columns = [column['full_name'] for column in inspector.get_columns('doctors')]

    # Step 1: Add the column only if it doesn't already exist
    if 'full_name' not in columns:
        op.add_column('doctors', sa.Column('full_name', sa.String(length=100), nullable=True))

    # Step 2: Update existing rows to set a default value for full_name where it's NULL
    op.execute("UPDATE doctors SET full_name = 'Unknown Doctor' WHERE full_name IS NULL")

    # Step 3: Alter the column to make it NOT NULL
    op.alter_column('doctors', 'full_name', nullable=False)

def downgrade() -> None:
    # Drop the column if downgrading
    op.drop_column('doctors', 'full_name')
