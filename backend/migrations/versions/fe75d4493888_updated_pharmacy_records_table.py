"""Updated pharmacy_records table

Revision ID: fe75d4493888
Revises: 9992b3cb3933
Create Date: 2025-02-28 09:01:07.030956

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe75d4493888'
down_revision: Union[str, None] = '9992b3cb3933'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('pharmacy_records', 'drug_orders',
               existing_type=sa.TEXT(),
               type_=sa.JSON(),
               existing_nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('pharmacy_records', 'drug_orders',
               existing_type=sa.JSON(),
               type_=sa.TEXT(),
               existing_nullable=True)
    # ### end Alembic commands ###
