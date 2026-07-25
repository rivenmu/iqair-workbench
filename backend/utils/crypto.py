"""AES-256 encryption for snapshot files, key derived from SECRET_KEY via HKDF."""
import os
from hashlib import sha256
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from django.conf import settings

_SALT = b'iqair-snapshot-salt-v1'
_INFO = b'iqair-snapshot-encryption'


def _derive_key():
    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=_SALT, info=_INFO)
    return hkdf.derive(settings.SECRET_KEY.encode('utf-8'))


def encrypt_snapshot(plain_bytes: bytes) -> bytes:
    """Encrypt snapshot data. Returns nonce + ciphertext (AES-256-GCM)."""
    key = _derive_key()
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plain_bytes, None)
    return nonce + ciphertext


def decrypt_snapshot(encrypted_bytes: bytes) -> bytes:
    """Decrypt snapshot data. Raises exception if tampered."""
    key = _derive_key()
    nonce = encrypted_bytes[:12]
    ciphertext = encrypted_bytes[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)
