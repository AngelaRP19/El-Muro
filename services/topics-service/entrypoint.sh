#!/bin/sh
set -e

# /app/alembic/ (migrations dir) shadows the 'alembic' package when '' (cwd) is
# first in sys.path. We remove '' and place /app after site-packages so the real
# package is resolved first, while src.* imports still find /app.
python - <<'PYEOF'
import sys
sys.path = [p for p in sys.path if p != ''] + ['/app']
from alembic.config import Config
from alembic import command
c = Config('/app/alembic.ini')
command.upgrade(c, 'head')
PYEOF

exec python -m src.infrastructure.api.app
