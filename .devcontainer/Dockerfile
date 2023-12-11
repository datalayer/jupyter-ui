ARG VARIANT=latest
FROM ghcr.io/mamba-org/micromamba-devcontainer:${VARIANT}

LABEL maintainer="Datalayer <support@datalayer.io>"

# Install the Conda packages.
COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/environment.yml
RUN : \
    # Configure Conda to use the conda-forge channel
    && micromamba config append channels conda-forge \
    # Install and clean up
    && micromamba install --yes -c conda-forge --name base \
        --file /tmp/environment.yml \
    && micromamba clean --all --force-pkgs-dirs --yes \
;
