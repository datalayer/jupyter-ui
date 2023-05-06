"""Handlers
"""

import json

import tornado

from tornado import ioloop
from tornado.websocket import WebSocketHandler

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.base.zmqhandlers import WebSocketMixin
from jupyter_server.utils import url_path_join


class JupyterDockerHandler(JupyterHandler):
    """JupyterDockerHandler"""

    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyter_ux/get_example endpoint!"
        }))


class WsEchoHandler(WebSocketMixin, WebSocketHandler, JupyterHandler):
    """WsEchoHandler"""

    def open(self, *args, **kwargs):
        """open"""
        print("WebSocket opened.")
        super(WebSocketMixin, self).open(*args, **kwargs)
        loop = ioloop.IOLoop.current()
        self.last_ping = loop.time()
        self.last_pong = self.last_ping
        self.ping_callback = ioloop.PeriodicCallback(
            self.send_hello,
            1000,
        )
        self.ping_callback.start()

    def send_hello(self):
        """send a hello"""
        if self.ws_connection is None and self.ping_callback is not None:
            self.ping_callback.stop()
            return
        if self.ws_connection.client_terminated:
            self.close()
            return
        # check for timeout on pong.  Make sure that we really have sent a recent ping in
        # case the machine with both server and client has been suspended since the last ping.
        now = ioloop.IOLoop.current().time()
        since_last_hello = 1e3 * (now - self.last_pong)
        since_last_hello = 1e3 * (now - self.last_ping)
        if since_last_hello < 2 * self.ping_interval and since_last_hello > self.ping_timeout:
            self.log.warning("WebSocket ping timeout after %i ms.", since_last_hello)
            self.close()
            return
        self.last_ping = now
        self.write_message('hello...')


    def on_message(self, message):
        """on_message"""
        print("WebSocket message: " + message)
        self.write_message(str(message) + '... pong')

    def on_close(self):
        """on_close"""
        print("WebSocket closed")


def setup_handlers(web_app):
    """setup handlers"""
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyter_ux", "get_example")
    echo_pattern = url_path_join(base_url, "jupyter_ux", "echo")
    handlers = [
        (route_pattern, JupyterDockerHandler),
        (echo_pattern, WsEchoHandler),
    ]
    web_app.add_handlers(host_pattern, handlers)
