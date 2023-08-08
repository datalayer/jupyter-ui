# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

FROM python:3.11

RUN mkdir /opt/jupyter-dashboard

WORKDIR /opt/jupyter-dashboard

RUN pip install kazoo

COPY jupyter_dashboard /opt/jupyter_dashboard
RUN pip install -e ./jupyter_dashboard

# COPY frontplane/dist.html /opt/jupyter-dashboard/index.html

WORKDIR /opt/jupyter-dashboard/editor

EXPOSE 9300

CMD ["python", "-m", "jupyter_dashboard"]
