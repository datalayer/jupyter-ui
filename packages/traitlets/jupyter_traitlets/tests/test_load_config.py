"""Test the loading of configs."""

import os

from pathlib import Path
from traitlets.config.loader import Config

from ..load_config import load_config


fixtures_dir = Path(__file__).parent / "fixtures_1"
os.chdir(fixtures_dir)


def test_load_config():
    """Test the loading of a configuration."""
    config = Config()
    c_notebook = load_config("jupyter_notebook", fixtures_dir)
    assert c_notebook.NotebookApp.port == 8889
    config.merge(c_notebook)
    assert isinstance(config, Config) is True
    notebookapp = config.NotebookApp
    assert isinstance(notebookapp, Config) is True
    assert config.NotebookApp.hello == "hello"
    config.NotebookApp2 = notebookapp
    assert config.NotebookApp2.hello == "hello"
    config['NotebookApp3'] = notebookapp
    assert config.NotebookApp3.hello == "hello"
    notebookapp2 = Config()
    notebookapp2.hello = 'hello2'
    config.NotebookApp.merge(notebookapp2)
    assert config.NotebookApp.hello == "hello2"
    # notebookapp.items() == dict_items([('allow_credentials', False), ('port', 8889), ('password_required', True), ('hello', 'hello2')])
    # notebookapp.keys()) == dict_keys(['allow_credentials', 'port', 'password_required', 'hello'])
    # notebookapp.values()) == dict_values([False, 8889, True, 'hello2'])
    # config.to_dict.to_dict()
    # config.section_names.to_dict()
    # config.class_config_section.to_dict()
    # config.class_config_rst_doc.to_dict()
