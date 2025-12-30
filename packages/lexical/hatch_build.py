# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

import glob
import os

from subprocess import check_call

import shutil

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


here = os.path.abspath(os.path.dirname(__file__))


def clean_dist():
    dist_path = os.path.join(here, 'dist')
    if os.path.exists(dist_path):
        shutil.rmtree(dist_path)


def build_javascript():
    # Install deps
    check_call(
        ['jlpm', 'install'],
        cwd=here,
    )

    # Step 1: Vite build (copied under static/vite/)
    clean_dist()
    vite_env = os.environ.copy()
    vite_env['VITE_BASE_URL'] = '/static/jupyter_lexical/vite/'
    check_call(
        ['jlpm', 'run', 'build:vite'],
        cwd=here,
        env=vite_env,
    )
    os.makedirs('./jupyter_lexical/static/vite', exist_ok=True)
    for file in glob.glob(r'./dist/*.*'):
        shutil.copy(
            file,
            './jupyter_lexical/static/vite/'
        )

    # Step 2: Webpack build (legacy) copied to static root
    clean_dist()
    check_call(
        ['jlpm', 'run', 'build:webpack', '--mode=production'],
        cwd=here,
    )
    for file in glob.glob(r'./dist/*.*'):
        shutil.copy(
            file,
            './jupyter_lexical/static/'
        )


class JupyterBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        if self.target_name == 'editable':
            build_javascript()
        elif self.target_name == 'wheel':
            build_javascript()
        elif self.target_name == 'sdist':
            build_javascript()
