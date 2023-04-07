"""Test the shimming of the configs."""

import os

from pathlib import Path

from ..shim_config import merge_notebook_configs


fixtures_dir = Path(__file__).parent / "fixtures_2"
os.chdir(fixtures_dir)


def test_none():
    """Test None parameters support."""
    merged = merge_notebook_configs()
    print(merged.NotebookApp)
    assert merged.NotebookApp != None
    assert merged.ServerApp != None
    assert merged.MyExt != None


def test_merge():
    """Test NotebookApp are copied to ServerApp."""
    merged = merge_notebook_configs(
        notebook_config_name = 'jupyter_notebook',
        server_config_name = 'jupyter_nbclassic',
        other_config_name = 'jupyter_my_ext',
        )
    assert merged.NotebookApp.port == 8889
    assert merged.NotebookApp.allow_credentials == False
    assert merged.NotebookApp.password_required == True
    assert merged.ServerApp.port == 8889
    assert merged.ServerApp.allow_credentials == False
    assert merged.ServerApp.password_required == True

    assert merged.MyExt.hello == 'My extension'


def test_merge_cli_order():
    """Test NotebookApp are copied to ServerApp 
    and CLI flags are processed."""
    merged = merge_notebook_configs(
        notebook_config_name = 'jupyter_notebook',
        server_config_name = 'jupyter_nbclassic',
        other_config_name = 'jupyter_my_ext',
        argv = [
            '--NotebookApp.port=1111',
            ]
        )
    assert merged.NotebookApp.port == 1111
    assert merged.NotebookApp.allow_credentials == True
    assert merged.NotebookApp.password_required == True
    assert merged.ServerApp.port == 1111
    assert merged.ServerApp.allow_credentials == True
    assert merged.ServerApp.password_required == True
    assert merged.MyExt.hello == 'My extension'


def test_merge_cli_order_2():
    """Test NotebookApp are copied to ServerApp 
    and CLI flags are processed in correct order."""
    merged = merge_notebook_configs(
        notebook_config_name = 'jupyter_notebook',
        server_config_name = 'jupyter_nbclassic',
        other_config_name = 'jupyter_my_ext',
        argv = [
            '--NotebookApp.port=1111',
            '--ServerApp.port=2222',
            '--MyExt.more=True',
            ]
        )
    assert merged.NotebookApp.port == 2222
    assert merged.NotebookApp.allow_credentials == False
    assert merged.NotebookApp.password_required == True
    assert merged.ServerApp.port == 2222
    assert merged.ServerApp.allow_credentials == False
    assert merged.ServerApp.password_required == True
    assert merged.MyExt.hello == 'My extension'
    assert merged.MyExt.more == True
