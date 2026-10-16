import pytest

from .harness import make_env


@pytest.fixture()
def env():
    return make_env()
