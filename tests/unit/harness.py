"""A tiny stand-in for the GenLayer runtime so the contract logic can be unit tested
with plain pytest. It does not simulate consensus; it only provides the names the
contract imports (gl, u256, Address, TreeMap, allow_storage)."""
import importlib.util
import pathlib
import sys
import types

class u256(int):
    def __new__(cls, value=0):
        value = int(value)
        if value < 0 or value >= 2**256:
            raise OverflowError("u256 out of range")
        return super().__new__(cls, value)

    def __add__(self, o):
        return u256(int(self) + int(o))

    def __sub__(self, o):
        return u256(int(self) - int(o))

    def __mul__(self, o):
        return u256(int(self) * int(o))


class Address:
    def __init__(self, value):
        self.as_hex = str(value).lower()

    def __eq__(self, other):
        return isinstance(other, Address) and self.as_hex == other.as_hex

    def __hash__(self):
        return hash(self.as_hex)


class TreeMap(dict):
    def __class_getitem__(cls, item):
        return cls


class UserError(Exception):
    pass


def _build_runtime():
    gl = types.SimpleNamespace()
    gl.transfers = []
    gl.message = types.SimpleNamespace(sender_address=Address("0xowner"), value=u256(0))
    gl.vm = types.SimpleNamespace(UserError=UserError)

    def write(fn):
        return fn

    write.payable = lambda fn: fn
    gl.public = types.SimpleNamespace(write=write, view=lambda fn: fn)

    def contract_interface(cls):
        class Bound:
            def __init__(self, address):
                self.address = address

            def emit_transfer(self, value):
                gl.transfers.append((self.address.as_hex, int(value)))

        return Bound

    gl.evm = types.SimpleNamespace(contract_interface=contract_interface)

    class Contract:
        def __new__(cls, *a, **k):
            obj = super().__new__(cls)
            for name, ann in getattr(cls, "__annotations__", {}).items():
                if ann is TreeMap:
                    setattr(obj, name, TreeMap())
                elif ann is u256:
                    setattr(obj, name, u256(0))
            return obj

    gl.Contract = Contract
    gl.pages = {}
    gl.replies = []
    gl.prompts = []

    def render(url, mode="text"):
        return gl.pages[url]

    def exec_prompt(prompt):
        gl.prompts.append(prompt)
        return gl.replies.pop(0)

    gl.nondet = types.SimpleNamespace(
        web=types.SimpleNamespace(render=render), exec_prompt=exec_prompt
    )
    gl.eq_principle = types.SimpleNamespace(prompt_comparative=lambda fn, rule: fn())
    return gl


def make_env():
    gl = _build_runtime()
    module = types.ModuleType("genlayer")
    module.gl = gl
    module.u256 = u256
    module.Address = Address
    module.TreeMap = TreeMap
    module.allow_storage = lambda cls: cls
    sys.modules["genlayer"] = module

    path = pathlib.Path(__file__).resolve().parents[2] / "contracts" / "fixproof.py"
    spec = importlib.util.spec_from_file_location("fixproof_under_test", path)
    fp = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fp)

    clock = {"now": 1_000_000}
    fp._now = lambda: clock["now"]
    return types.SimpleNamespace(gl=gl, fp=fp, clock=clock)
