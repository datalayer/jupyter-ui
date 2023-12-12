# Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
#
# MIT License

"""Index handler."""

import tornado

from ..base import BaseTemplateHandler


# pylint: disable=W0223
class IndexHandler(BaseTemplateHandler):
    """The handler for the index."""

    @tornado.web.authenticated
    def get(self):
        """The index page."""
        self.write(self.render_template("index.html"))
