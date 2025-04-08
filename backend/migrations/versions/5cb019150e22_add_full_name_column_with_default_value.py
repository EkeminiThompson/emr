"""Add full_name column with default value

Revision ID: 5cb019150e22
Revises: feffb88f41f6
Create Date: 2025-02-16 06:00:09.176487

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5cb019150e22'
down_revision: Union[str, None] = 'feffb88f41f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
