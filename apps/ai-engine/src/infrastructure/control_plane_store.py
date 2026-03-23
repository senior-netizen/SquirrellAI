from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

DEFAULT_STORE_VERSION = '1.0.0'
DEFAULT_CONTROL_PLANE_STORE = {
    'version': DEFAULT_STORE_VERSION,
    'agents': [
        {
            'id': 'planner',
            'status': 'available',
            'description': 'Primary planning agent for control-plane orchestrations.',
        }
    ],
    'tools': [
        {
            'name': 'search',
            'owner': 'ai-engine',
            'timeoutSeconds': 30,
        }
    ],
    'executions': [],
}


def _repository_root() -> Path:
    return Path(__file__).resolve().parents[4]


def get_store_path() -> Path:
    return Path(os.environ.get('CONTROL_PLANE_STORE_PATH', _repository_root() / 'var' / 'control-plane-store.json'))


def load_control_plane_store() -> dict[str, Any]:
    path = get_store_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    if not path.exists():
        path.write_text(json.dumps(DEFAULT_CONTROL_PLANE_STORE, indent=2), encoding='utf-8')

    return json.loads(path.read_text(encoding='utf-8'))
