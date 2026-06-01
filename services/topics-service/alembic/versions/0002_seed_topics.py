"""seed initial topics

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-01 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

_TOPIC_IDS = [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "c3d4e5f6-a7b8-9012-cdef-123456789012",
]


def upgrade() -> None:
    op.execute("""
        INSERT INTO topics (id, name, slug, description, is_active, created_at, updated_at)
        VALUES
            ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tecnología', 'tecnologia', 'Noticias, tendencias y debates sobre software, hardware e innovación.', true, NOW(), NOW()),
            ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Deportes', 'deportes', 'Todo sobre fútbol, básquet y cualquier disciplina deportiva.', true, NOW(), NOW()),
            ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Entretenimiento', 'entretenimiento', 'Películas, series, música y cultura pop.', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    for topic_id in _TOPIC_IDS:
        op.execute(f"DELETE FROM topics WHERE id = '{topic_id}'")
