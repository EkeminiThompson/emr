"""Add full_name column with default value

Revision ID: 6e454b991450
Revises: 5cb019150e22
Create Date: 2025-02-16 06:19:39.025900

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e454b991450'
down_revision: Union[str, None] = '5cb019150e22'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
