"""Drop full_name column from doctors

Revision ID: de1bb5d90e68
Revises: 4c0999ecf6b0
Create Date: 2025-02-16 05:51:00.810440

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de1bb5d90e68'
down_revision: Union[str, None] = '4c0999ecf6b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
