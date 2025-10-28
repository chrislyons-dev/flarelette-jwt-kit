
import os
from typing import Mapping

def apply_env_bindings(env: Mapping[str, str]) -> None:
    """Copy a Cloudflare Worker `env` mapping into os.environ so the kit can read it.
    This is useful on edge where traditional process envs don't exist.
    """
    for k, v in env.items():
        if isinstance(v, str):
            os.environ[k] = v
