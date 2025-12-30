# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

import glob
import os
import re

from subprocess import check_call

import shutil

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


here = os.path.abspath(os.path.dirname(__file__))


def patch_package_json_requires(file_path):
    """Patch built JS files to replace require('../package.json') patterns.
    
    This is similar to the patch for @jupyter-widgets/controls that replaces:
      require('../package.json').version -> hardcoded version string
    
    This prevents RequireJS from intercepting these calls at runtime.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern to match require("../package.json") or require('../package.json')
    # and similar patterns like require("./package.json")
    patterns = [
        # require("../package.json").version or require('../package.json').version
        (r'require\(["\']\.\.?/package\.json["\']\)\.version', '"0.0.0"'),
        # require("../package.json") or require('../package.json') standalone
        (r'require\(["\']\.\.?/package\.json["\']\)', '{version:"0.0.0"}'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched package.json requires in: {file_path}")


def build_javascript():
    check_call(
        ['npm', 'install'],
        cwd=here,
    )
    # Set VITE_BASE_URL for the build so dynamic imports use the correct path
    build_env = os.environ.copy()
    build_env['VITE_BASE_URL'] = '/static/jupyter_react/'
    check_call(
        ['npm', 'run', 'build:vite'],
        cwd=here,
        env=build_env,
    )
    # Copy and patch built files
    for file in glob.glob(r'./dist/*.*'):
        shutil.copy(
            file,
            './jupyter_react/static/'
        )
        # Patch JS files to remove package.json requires
        if file.endswith('.js'):
            static_file = os.path.join('./jupyter_react/static/', os.path.basename(file))
            patch_package_json_requires(static_file)


class JupyterBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        if self.target_name == 'editable':
            build_javascript()
        elif self.target_name == 'wheel':
            build_javascript()
        elif self.target_name == 'sdist':
            build_javascript()
