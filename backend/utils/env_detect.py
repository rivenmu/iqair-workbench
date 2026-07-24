"""
Environment auto-detection utility (zero-config).

Provides multi-signal detection of whether the application is running in a
local development environment or on the production server. The first signal
that yields a definitive answer wins; if all signals are inconclusive, the
safe fallback is "production".

Detection chain (highest priority first):
  1. DEPLOY_ENV env var  -- explicit override, set in docker-compose.override.yml
  2. Sync-service DNS    -- "iqair-db-sync" only resolves when the local
                            override defines a db-sync service
  3. Safe fallback       -- production
"""

import os
import socket
import logging

logger = logging.getLogger(__name__)

__all__ = ["detect_deploy_env", "is_local", "is_production", "get_env_info"]


def _check_sync_service_dns():
    """Return 'local' if the db-sync hostname resolves, else None.

    The db-sync service is ONLY defined in docker-compose.override.yml --
    a file that exists on the local machine and is gitignored on the server.
    Docker's embedded DNS resolves service names within the compose network,
    so this lookups succeeds only when the override file is present and
    the services share the same network.
    """
    try:
        socket.getaddrinfo("iqair-db-sync", None, socket.AF_INET, socket.SOCK_STREAM)
        return "local"
    except (socket.gaierror, socket.herror, OSError):
        return None


def detect_deploy_env():
    """Auto-detect deployment environment with zero manual configuration.

    Returns 'local' or 'production'.
    """
    # Signal 1: explicit env-var override (highest priority)
    env = os.environ.get("DEPLOY_ENV", "").strip().lower()
    if env in ("local", "production"):
        logger.debug("env_detect: DEPLOY_ENV override -> %s", env)
        return env

    # Signal 2: db-sync service exists (structural -- local override only)
    sync_signal = _check_sync_service_dns()
    if sync_signal:
        logger.debug("env_detect: db-sync DNS resolved -> %s", sync_signal)
        return sync_signal

    # Signal 3: safe fallback
    logger.debug("env_detect: no signals matched -> production (fallback)")
    return "production"


def is_local():
    """True if running in the local development environment."""
    return detect_deploy_env() == "local"


def is_production():
    """True if running on the production server."""
    return detect_deploy_env() == "production"


def get_env_info():
    """Return a dict with full environment context for debugging / display."""
    env = detect_deploy_env()
    return {
        "env": env,
        "is_local": env == "local",
        "is_production": env == "production",
        "debug": os.environ.get("DEBUG", "False") == "True",
        "sync_enabled": env == "local"
        and os.environ.get("SYNC_ENABLED", "true").lower() == "true",
        "server_host": os.environ.get("SYNC_SERVER_HOST", "10.0.0.6"),
    }
