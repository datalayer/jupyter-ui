import { useEffect } from 'react';

type Props = {
  theme: 'light' | 'dark',
}

export const JupyterLabCss = (props: Props) => {
  const { theme } = props;
  useEffect(() => {
    import('@jupyterlab/apputils/style/base.css');
    import('@jupyterlab/rendermime/style/base.css');
    import('@jupyterlab/codeeditor/style/base.css');
    import('@jupyterlab/cells/style/base.css');
    import('@jupyterlab/documentsearch/style/base.css');
    import('@jupyterlab/outputarea/style/base.css');
    import('@jupyterlab/console/style/base.css');
    import('@jupyterlab/completer/style/base.css');
    import('@jupyterlab/codemirror/style/base.css');
    import('@jupyterlab/codeeditor/style/base.css');
    import('@jupyterlab/cells/style/base.css');
    import('@jupyterlab/notebook/style/base.css');
    import('@jupyterlab/filebrowser/style/base.css');
    import('@jupyterlab/terminal/style/base.css');
    switch(theme) {
      case 'light': {
        import('@jupyterlab/theme-light-extension/style/theme.css');
        break;
      }
      case 'dark': {
        import('@jupyterlab/theme-dark-extension/style/theme.css');
        break;
      }
    }
    import('@jupyterlab/ui-components/style/base.css');
    //
    import('@jupyter-widgets/base/css/index.css');
    import('@jupyter-widgets/controls/css/widgets-base.css');        
  }, [theme]);
  return <></>
}

export default JupyterLabCss;
