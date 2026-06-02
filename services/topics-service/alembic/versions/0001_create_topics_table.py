"""create topics table

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "topics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_topics_name", "topics", ["name"])
    op.create_index("ix_topics_slug", "topics", ["slug"])
    op.create_index("ix_topics_is_active", "topics", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_topics_is_active", table_name="topics")
    op.drop_index("ix_topics_slug", table_name="topics")
    op.drop_index("ix_topics_name", table_name="topics")
    op.drop_table("topics")
