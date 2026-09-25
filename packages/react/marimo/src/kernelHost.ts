/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The kernel side of a marimo notebook on a Jupyter kernel.
 *
 * marimo ships an in-process session, `marimo._pyodide.PyodideSession`, for
 * its browser (Pyodide) runtime: the whole marimo kernel driven by an asyncio
 * task, commands in through `PyodideBridge`, notifications out through a
 * callback. It runs just as well on CPython, on the asyncio loop an ipykernel
 * already has. This source, sent to the kernel as one execute request, opens
 * a comm target that hosts such a session: the frontend's bridge calls
 * `PyodideBridge` methods by name over the comm, exactly as marimo's Pyodide
 * worker does, and every kernel message comes back the same way.
 *
 * Two things differ from Pyodide and are handled here: marimo's networking
 * patch imports `pyodide_http`, which does not exist on CPython, and the
 * message callback must never write to `sys.stdout`, which marimo redirects
 * into its own stream while a cell runs.
 *
 * @module marimo/kernelHost
 */

/** The comm target the host registers; the bridge opens a comm on it. */
export const COMM_TARGET = 'datalayer.marimo';

/** The name the host is bound to in the kernel's namespace. */
export const HOST_NAME = '__datalayer_marimo_host__';

/**
 * The Python source of the host. `{{TARGET}}` and `{{NAME}}` are substituted
 * by `kernelHostSource()`.
 */
const SOURCE = String.raw`
import asyncio, inspect, json, os, sys, traceback

def _datalayer_marimo_install(target, name):
    ip = get_ipython()
    existing = ip.user_ns.get(name)
    if existing is not None and getattr(existing, "comm_target", None) == target:
        return existing

    import marimo._runtime.patches as _patches
    # Pyodide-only: it imports pyodide_http. On CPython there is nothing to patch.
    _patches.patch_pyodide_networking = lambda: None
    from marimo._pyodide.bootstrap import create_session, instantiate

    class DatalayerMarimoHost:
        """Hosts one marimo session per comm and answers the bridge's calls."""

        # A class body cannot rebind a name it reads from the enclosing scope.
        comm_target = target

        def __init__(self):
            self.sessions = {}
            ip.kernel.comm_manager.register_target(target, self._on_open)

        # -- comm lifecycle ---------------------------------------------

        def _on_open(self, comm, msg):
            state = {"comm": comm, "session": None, "bridge": None, "task": None}
            self.sessions[comm.comm_id] = state
            comm.on_msg(lambda m, s=state: self._on_msg(s, m))
            comm.on_close(lambda m, s=state: self._stop(s))
            comm.send({"kind": "ready"})

        def _on_msg(self, state, msg):
            data = msg["content"]["data"]
            kind = data.get("kind")
            rid = data.get("id")
            if kind == "start":
                asyncio.ensure_future(self._start(state, data, rid))
            elif kind == "bridge":
                asyncio.ensure_future(self._call(state, data, rid))
            elif kind == "stop":
                self._stop(state)
            else:
                self._send(state, {"kind": "error", "id": rid, "error": f"unknown message kind {kind!r}"})

        def _send(self, state, payload):
            # Never through sys.stdout: marimo redirects it while a cell runs,
            # and a write from here would re-enter its own stream.
            try:
                state["comm"].send(payload)
            except Exception:
                sys.__stderr__.write("marimo host: comm send failed\n" + traceback.format_exc())

        # -- the session ------------------------------------------------

        async def _start(self, state, data, rid):
            try:
                filename = data.get("filename") or "notebook.py"
                code = data.get("code") or ""
                filename = os.path.abspath(filename)
                if code or not os.path.exists(filename):
                    os.makedirs(os.path.dirname(filename) or ".", exist_ok=True)
                    with open(filename, "w", encoding="utf-8") as f:
                        f.write(code)
                query_params = data.get("queryParams") or {}
                user_config = data.get("userConfig") or {}

                def on_message(text):
                    self._send(state, {"kind": "kernel", "message": text})

                session, bridge = create_session(filename, query_params, on_message, user_config)
                state["session"] = session
                state["bridge"] = bridge
                state["filename"] = filename
                state["task"] = asyncio.ensure_future(session.start())
                instantiate(session, auto_instantiate=bool(data.get("autoInstantiate", True)))
                self._send(state, {"kind": "started", "id": rid, "filename": filename})
            except Exception:
                self._send(state, {"kind": "error", "id": rid, "error": traceback.format_exc()})

        async def _call(self, state, data, rid):
            bridge = state["bridge"]
            function = data.get("function")
            payload = data.get("payload")
            try:
                if bridge is None:
                    raise RuntimeError("the marimo session is not started")
                method = getattr(bridge, function)
                result = method() if payload is None else method(payload)
                if inspect.isawaitable(result):
                    result = await result
                self._send(state, {"kind": "result", "id": rid, "result": result})
            except Exception:
                self._send(state, {"kind": "error", "id": rid, "error": traceback.format_exc()})

        def _stop(self, state):
            session = state.get("session")
            task = state.get("task")
            if session is not None:
                try:
                    session._queue_manager.close_queues()
                except Exception:
                    pass
            if task is not None:
                # RestartableTask restarts on a plain cancel: mark it stopped first.
                try:
                    session.kernel_task.stop()
                except Exception:
                    task.cancel()
            state["session"] = None
            state["bridge"] = None
            state["task"] = None
            self.sessions.pop(state["comm"].comm_id, None)

    host = DatalayerMarimoHost()
    ip.user_ns[name] = host
    return host

_datalayer_marimo_install({{TARGET}}, {{NAME}})
`;

/** The host source, with the comm target and the namespace name filled in. */
export function kernelHostSource(
  target: string = COMM_TARGET,
  name: string = HOST_NAME
): string {
  return SOURCE.replace('{{TARGET}}', JSON.stringify(target)).replace(
    '{{NAME}}',
    JSON.stringify(name)
  );
}
