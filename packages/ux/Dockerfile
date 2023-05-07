# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

FROM python:3.10.4

RUN mkdir /opt/datalayer

WORKDIR /opt/datalayer

RUN pip install kazoo

COPY backplane /opt/datalayer/backplane
RUN pip install -e ./backplane

COPY frontplane/dist.html /opt/datalayer/index.html

WORKDIR /opt/datalayer/editor

EXPOSE 9300

CMD ["python", "jupyter_ux/main.py"]
