"""Configuration for the Jupyter development server."""

import os

#################
# Logging
#################

c.ServerApp.log_level = 'INFO'

#################
# Network
#################

c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8686
c.ServerApp.port_retries = 0

#################
# Browser
#################

c.ServerApp.open_browser = False

#################
# Terminal
#################

c.ServerApp.terminals_enabled = True

#################
# Authentication
#################

c.ServerApp.token = '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6'

#################
# Security
#################

c.ServerApp.disable_check_xsrf = False
# ORIGIN = 'http://localhost:3208'
ORIGIN = '*'
# c.ServerApp.allow_origin = ORIGIN
c.ServerApp.allow_origin_pat = '.*'
c.ServerApp.allow_credentials = True
c.ServerApp.tornado_settings = {
  'headers': {
#    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': 'Accept, Accept-Encoding, Accept-Language, Authorization, Cache-Control, Connection, Content-Type, Host, Origin, Pragma, Referer, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Upgrade, User-Agent, X-XSRFToken, X-Datalayer, Expires',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Security-Policy': f"frame-ancestors 'self' {ORIGIN} ",
  },
  'cookie_options': {
    'SameSite': 'None',
    'Secure': True
  }
}
c.ServerApp.cookie_options = {
  "SameSite": "None",
  "Secure": True,
}

#################
# Server Extensions
#################

c.ServerApp.jpserver_extensions = {
    'jupyterlab': True,
    'jupyter_server_terminals': True,
}

#################
# Content
#################

# c.FileContentsManager.delete_to_trash = False
content_dir = os.path.dirname(os.path.realpath(__file__)) + '/../notebooks'
c.ServerApp.root_dir = content_dir
c.ServerApp.preferred_dir = content_dir

#################
# URLs
#################

c.ServerApp.base_url = '/api/jupyter'
c.ServerApp.default_url = '/api/jupyter/lab'

#################
# Kernel
#################

# See
# https://github.com/jupyterlab/jupyterlab/pull/11841
# https://github.com/jupyter-server/jupyter_server/pull/657
c.ServerApp.kernel_ws_protocol = None # None or ''

#################
# JupyterLab
#################

c.LabApp.collaborative = True
