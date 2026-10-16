"""Network settings used by tools that talk to GenLayer Studio from Python.

Values come from the environment so nothing is hard-coded. Defaults match the
Studio network FixProof is deployed on.
"""
import os

DEFAULTS = {
    "rpc_url": "https://studio.genlayer.com/api",
    "chain_id": "61999",
    "explorer_url": "https://explorer-studio.genlayer.com",
}


def get_config() -> dict:
    return {
        "rpc_url": os.environ.get("GENLAYER_RPC_URL", DEFAULTS["rpc_url"]),
        "chain_id": int(os.environ.get("GENLAYER_CHAIN_ID", DEFAULTS["chain_id"])),
        "explorer_url": os.environ.get("GENLAYER_EXPLORER_URL", DEFAULTS["explorer_url"]),
        "contract_address": os.environ.get("CONTRACT_ADDRESS", ""),
    }
