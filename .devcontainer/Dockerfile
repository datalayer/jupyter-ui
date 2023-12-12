ARG VARIANT=latest
#
# Development image
#
FROM ghcr.io/mamba-org/micromamba-devcontainer:${VARIANT} as dev

LABEL maintainer="Datalayer <support@datalayer.io>"

# Install the Conda packages.
COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/environment.yml
RUN : \
    # Configure Conda to use the conda-forge channel
    && micromamba config append channels conda-forge \
    # Install and clean up
    && micromamba env create --yes -c conda-forge --name datalayer \
        --file /tmp/environment.yml \
    && micromamba clean --all --force-pkgs-dirs --yes \
;

# Set the default environment
ENV ENV_NAME=datalayer

#
#  Builder image
#
FROM dev as builder

LABEL maintainer="Datalayer <support@datalayer.io>"

# Copy the code
COPY --chown=${MAMBA_USER}:${MAMBA_USER} . /workspaces/jupyter-ui

RUN : \
    && eval "$(micromamba shell hook --shell bash)" \
    && micromamba activate datalayer \
    && cd /workspaces/jupyter-ui \
    # Install JS dependencies
    && yarn install \
    # Build JS assets
    && yarn build \
;
