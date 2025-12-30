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


def clean_dist():
    """Remove the contents of the dist folder and tsconfig.tsbuildinfo."""
    dist_path = os.path.join(here, 'dist')
    if os.path.exists(dist_path):
        shutil.rmtree(dist_path)
        print(f"Cleaned dist folder: {dist_path}")
    
    # Also remove tsconfig.tsbuildinfo if it exists
    tsbuildinfo_path = os.path.join(here, 'tsconfig.tsbuildinfo')
    if os.path.exists(tsbuildinfo_path):
        os.remove(tsbuildinfo_path)
        print(f"Removed tsconfig.tsbuildinfo: {tsbuildinfo_path}")


def build_vite_bundle():
    """Build Vite bundle for the server extension."""
    clean_dist()
    check_call(
        ['jlpm', 'install'],
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
    # Copy built files recursively to static folder
    dist_path = os.path.join(here, 'dist')
    static_path = os.path.join(here, 'jupyter_react', 'static')
    if os.path.exists(static_path):
        shutil.rmtree(static_path)
    shutil.copytree(dist_path, static_path)
    # Patch JS files to remove package.json requires
    for file in glob.glob(os.path.join(static_path, '**', '*.js'), recursive=True):
        patch_package_json_requires(file)


def build_jupyterlab_extension():
    """Build JupyterLab extension."""
    clean_dist()
    check_call(
        ['jlpm', 'run', 'build', '--mode=production'],
        cwd=here,
    )


def build_javascript():
    build_vite_bundle()
#    build_jupyterlab_extension()


class JupyterBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        if self.target_name == 'editable':
            build_javascript()
        elif self.target_name == 'wheel':
            build_javascript()
        elif self.target_name == 'sdist':
            build_javascript()
