"""Add full_name column with default value

Revision ID: feffb88f41f6
Revises: de1bb5d90e68
Create Date: 2025-02-16 05:52:22.885317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'feffb88f41f6'
down_revision: Union[str, None] = 'de1bb5d90e68'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
