import glob
import os

from subprocess import check_call

import shutil

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


here = os.path.abspath(os.path.dirname(__file__))


def build_javascript():
    check_call(
        ['yarn', 'install'],
        cwd=here,
    )
    check_call(
        ['yarn', 'build:webpack', '--mode=production'],
        cwd=here,
    )
    for file in glob.glob(r'./dist/*.js'):
        shutil.copy(
            file,
            './jupyter_dashboard/static/'
        )


class JupyterBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        if self.target_name == 'editable':
            build_javascript()
        elif self.target_name == 'wheel':
            build_javascript()
        elif self.target_name == 'sdist':
            build_javascript()
