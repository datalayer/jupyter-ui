import os


c.ServerApp.log_level = 'DEBUG'

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

c.ServerApp.token = ''

# from jupyterpool.authentication import github
# c.ServerApp.login_handler_class = github.LoginHandler

#################
# Security
#################

c.ServerApp.disable_check_xsrf = False
# ORIGIN = 'http://localhost:3063'
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
    'Content-Security-Policy': f"frame-ancestors 'self' {*} ",
  },
  'cookie_options': {
    'SameSite': 'None',
    'Secure': True
  }
}
c.ServerApp.cookie_options = {
  "SameSite": "None",
  "Secure": True
}

#################
# Authorization
#################

# from jupyter_server.services.auth.manager import AuthorizationManager

# class AuthorizationManagerExample(AuthorizationManager):
#     def is_authorized(self, handler, subject, action, resource):
#       if action in ['write', 'execute']:
#           return False # Only allows `read` operations.
#       res = check_opa_authorization(user, action, resource)
#       j = res.get("result", {})
#       return j.get("allow", False)
#         return True

# c.ServerApp.authorization_manager_class = AuthorizationManagerExample

#################
# Server Extensions
#################

c.ServerApp.jpserver_extensions = {
    'jupyterlab': True,
#    'jupyterpool': True,
}

#################
# Content
#################

# c.FileContentsManager.delete_to_trash = False
content_dir = os.path.dirname(os.path.realpath(__file__)) + '/../content'
c.ServerApp.root_dir = content_dir
c.ServerApp.preferred_dir = content_dir

#################
# URLs
#################

c.ServerApp.base_url = '/api/jupyter'
c.ServerApp.default_url = '/api/jupyter/lab'

#################
# JupyterLab
#################

c.LabApp.collaborative = True
