"""Dashboard publication handler."""

import json
import uuid
import boto3

import tornado

from jupyter_server.base.handlers import APIHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin


# pylint: disable=W0223
class PublishHandler(ExtensionHandlerMixin, APIHandler):
    """The handler for dashboard publication."""

    @tornado.web.authenticated
    async def post(self, path: str = ""):
        data = self.get_json_body()
        dashboard_id = str(uuid.uuid4())
        dashboard_file_name = dashboard_id + '.html'
        notebook_file_name = dashboard_id + '.ipynb'
        notebook = data['notebook']
        layout = data['layout']
        config = data['config']
        config['notebookUrl'] = notebook_file_name
        index_page = f"""<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <title>🪐 🏄 Jupyter Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js"></script>
    <script src="https://jupyter-dashboards.datalayer.tech/main.jupyter-dashboard.js"></script>
    <link rel="shortcut icon" href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAC7SURBVFiF7ZU9CgIxEIXfTHbPopfYc+pJ9AALtmJnZSOIoJWFoCTzLHazxh/Ebpt5EPIxM8XXTCKTxYyMCYwJFhOYCo4JFiMuu317PZwaqEBUIar4YMmskL73DytGjgu4gAt4PDJdzkkzMBloBhqBgcu69XW+1I+rNSQESNDuaMEhdP/Fj/7oW+ACLuACHk/3F5BAfuMLBjm8/ZnxNvNtHmY4b7Ztut0bqStoVSHfWj9Z6mr8LXABF3CBB3nvkDfEVN6PAAAAAElFTkSuQmCC" type="image/x-icon" />
    <script id="datalayer-dashboard-config" type="application/json">
        {json.dumps(config)}
    </script>
    <script id="datalayer-dashboard-layout" type="application/json">
        {json.dumps(layout)}
    </script>
  </head>
  <body>
  </body>
</html>
"""
        s3 = boto3.resource('s3')
        bucket = s3.Bucket('jupyter-dashboards')
        bucket.put_object(
            Key = dashboard_file_name,
            Body = index_page,
            ContentType = 'text/html'
        )
        bucket.put_object(
            Key = notebook_file_name,
            Body = json.dumps(notebook),
            ContentType = 'application/json'
        )
        """
        index_object = s3.Object(
            bucket_name = 'jupyter-dashboards', 
            key = dashboard_file_name,
        )
        index_object.put(
            Body = index_page
            ContentType='text/html',
        )
        notebook_object = s3.Object(
            bucket_name = 'jupyter-dashboards', 
            key = notebook_file_name,
        )
        notebook_object.put(
            Body = json.dumps(notebook),
            ContentType='text/html',
        )
        """
        response = {
            "success": True,
            "message": "The dashboard is published",
            "url": f"https://jupyter-dashboards.datalayer.tech/{dashboard_file_name}"
        }
        self.finish(json.dumps(response))
