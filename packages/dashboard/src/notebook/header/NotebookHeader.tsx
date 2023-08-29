
import { useState, useEffect } from 'react';
import { ThemeProvider, BaseStyles, Button, ButtonGroup, Box, Text, ActionList, ActionMenu, IconButton, Portal, registerPortalRoot, Spinner } from '@primer/react';
import { toast, ToastContainer } from 'react-toastify';
import { XIcon, KebabHorizontalIcon, PencilIcon, ArchiveIcon, TrashIcon, LinkExternalIcon, CheckIcon} from '@primer/octicons-react'
import { JupyterBaseIcon, DashboardGreenIcon, EyesIcon } from '@datalayer/icons-react'
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookContent } from '@jupyterlab/nbformat';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDashboardTracker } from './../../editor/dashboard';
import { CLASSIC_RENDER_WIDGET_FACTORY } from '../classic/plugin';
import { VIEWER_WIDGET_FACTORY } from '../viewer/plugin';
import { DashboardDocument } from './../../editor/dashboard';
import { ILayout } from '../../render/Types';
import { ILayoutVariant } from '../../render/Types';
import { NotebookBlankLayout } from '../../render/layout/NotebookBlankLayout';
import { NotebookSimpleLayout } from '../../render/layout/NotebookSimpleLayout';
import { NotebookArticleLayout } from '../../render/layout/NotebookArticleLayout';
import Identity from './Identity';
import { requestAPI } from './../../handler';

import 'react-toastify/dist/ReactToastify.css';

type Props = {
  app: JupyterFrontEnd;
  dashboardTracker: IDashboardTracker;
  notebookPanel: NotebookPanel;
}

const NotebookHeader = (props: Props) => {
  const { app, notebookPanel } = props;
  const { commands } = app;
  const [dashboardDocument, setDashboardDocument] = useState<DashboardDocument>();
  const [dropDownPortalName, setDropDownPortalName] = useState<string>();
  const [notebookPortalName, setNotebookPortalName] = useState<string>();
  const [dashboardUrl, setDashboardUrl] = useState<string>();
  const [publishing, setPublishing] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState(false);
  const [layoutVariant, setLayoutVariant] = useState<ILayoutVariant>('blank');
  useEffect(() => {
    const portalName = "notebook-header-dropdown-portal";
    registerPortalRoot(notebookPanel.node, portalName);
    setDropDownPortalName(portalName);
    const previewPortalName = "notebook-portal";
    registerPortalRoot(notebookPanel.node, previewPortalName);
    setNotebookPortalName(previewPortalName);
  }, [notebookPanel]);
  const showClassicRender = () => {
    commands.execute('docmanager:open', {
      path: notebookPanel.context.path,
      factory: CLASSIC_RENDER_WIDGET_FACTORY,
      options: {
        mode: 'split-right',
      }
    });
  };
  const showViewer = () => {
    commands.execute('docmanager:open', {
      path: notebookPanel.context.path,
      factory: VIEWER_WIDGET_FACTORY,
      options: {
        mode: 'split-right',
      }
    });
  };
  const showDashboard = () => {
    const dashboardPromise = commands.execute('docmanager:open', {
      path: notebookPanel.context.path.replace('.ipynb', '.dash'),
      factory: 'dashboard',
      options: {
        mode: 'split-right',
      }
    }) as Promise<DashboardDocument>;
    dashboardPromise?.then(dashboardDocument => {
      setDashboardDocument(dashboardDocument);
      dashboardDocument.disposed.connect(() => {
        setShowPreview(false);
        setDashboardDocument(undefined);
      });
    });
  };
  const publishDashboard = () => {
    setPublishing(true);
    requestAPI(
      'publish',
      'POST',
      {
        notebook:  notebookPanel.context.model.toJSON() as any,
        layout: dashboardDocument!.context.model.toJSON() as any,
        config: {
          layoutVariant,
        } as any,
      }
    )
    .then((data: any) => {
      setPublishing(false);
      toast(<>{data.message}. <a href={data.url} target="_blank">Click to open</a></>);
      setDashboardUrl(data.url);
    })
    .catch(reason => {
      setPublishing(false);
      toast(`Error while accessing the jupyter server jupyter_dashboard extension.\n${reason}`);
      console.error(
        `Error while accessing the jupyter server jupyter_dashboard extension.\n${reason}`
      );
    });
  };
  const removeDashboard = () => {
    dashboardDocument?.close();
  };
  const PreviewContent = () => {
    const [notebook, setNotebook] = useState<INotebookContent>();
    const [layout, setLayout] = useState<ILayout>();
    useEffect(() => {
      const notebook = notebookPanel.context.model.toJSON() as INotebookContent;
      setNotebook(notebook);
      const layout = dashboardDocument!.context.model.toJSON() as any as ILayout;
      setLayout(layout);
      /*
      dashboardDocument!.context.model.contentChanged.connect((_, content) => {
        const layout = dashboardDocument!.context.model.toJSON() as any as ILayout;
        setLayout(layout);  
      });
      */
    }, []);
    return (
      <Box>
        <Box display="flex">
          <Box flexGrow={1}></Box>
          <Box mr={1}>
            <IconButton
              icon={XIcon}
              aria-label="Close"
              variant="invisible"
              onClick={(e) => {e.preventDefault(); setShowPreview(false);}}
            />
          </Box>
        </Box>
        { layoutVariant === 'blank' && notebook && layout && <NotebookBlankLayout notebook={notebook} layout={layout} adaptPlotly={false} /> }
        { layoutVariant === 'simple' && notebook && layout && <NotebookSimpleLayout notebook={notebook} layout={layout} adaptPlotly={false} /> }
        { layoutVariant === 'article' && notebook && layout && <NotebookArticleLayout notebook={notebook} layout={layout} adaptPlotly={false} /> }
      </Box>
    )
  }
  return (
    <>
    { notebookPortalName && publishing &&
      <Portal containerName={notebookPortalName}>
        <Box
          sx={{
            position: "fixed",
            top: 30,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 109000,
          }}>
            <Box>
              <Spinner size="large" />
            </Box>
        </Box>
      </Portal>
    }
    { notebookPortalName && showPreview &&
      <Portal containerName={notebookPortalName}>
        <Box
          sx={{
            position: "fixed",
            top: 30,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'auto',
  //        alignItems: 'center',
  //        justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 1)',
            zIndex: 109000,
            marginLeft: 10,
            marginRight: 10,
          }}>
          <PreviewContent/>
        </Box>
      </Portal>
    }
    { dropDownPortalName &&
      <Portal containerName={dropDownPortalName}>
        <ThemeProvider>
          <BaseStyles>
          <ToastContainer/>
            <Box m={3} display="flex" sx={{paddingTop: "20px"}}>
              <Box flexGrow={1}>
                <Identity app={app}/>
              </Box>
              { !dashboardDocument
                ?
                  <Box>
                    <ButtonGroup>
                      <Button
                        aria-label="Render classic"
                        title="Render the classic way"
                        size="small"
                        variant="invisible"
                        leadingVisual={() => <JupyterBaseIcon colored/>}
                        onClick={e => { e.preventDefault(); showClassicRender()}}
                      >
                        Render classic
                      </Button>
                      <Button
                        aria-label="View"
                        title="View"
                        size="small"
                        variant="invisible"
                        leadingVisual={() => <EyesIcon colored/>}
                        onClick={e => { e.preventDefault(); showViewer()}}                
                      >
                        View static
                      </Button>
                      <Button
                        aria-label="Publish as a Dashboard"
                        title="Publish as a Dashboard"
                        size="small"
                        variant="invisible"
                        leadingVisual={() => <DashboardGreenIcon color="rgb(208, 207, 206)"/>}
                        onClick={e => { e.preventDefault(); showDashboard()}}
                      >
                        Publish
                      </Button>
                    </ButtonGroup>
                  </Box>
                :
                  <Box sx={{display: 'flex'}}>
                    <Box mr={3}>
                      <Text as="h4" sx={{marginTop: "5px"}}>Publish a dashboard</Text>
                    </Box>
                    <Box>
                      <ActionMenu>
                        <ActionMenu.Anchor>
                          <IconButton icon={KebabHorizontalIcon} variant="invisible" aria-label="Open column options" />
                        </ActionMenu.Anchor>
                        <ActionMenu.Overlay>
                          <ActionList>
                            <ActionList.Item>
                              <ActionList.LeadingVisual>
                                <PencilIcon />
                              </ActionList.LeadingVisual>
                              Rename
                            </ActionList.Item>
                            <ActionList.Item>
                              <ActionList.LeadingVisual>
                                <ArchiveIcon />
                              </ActionList.LeadingVisual>
                              Archive
                            </ActionList.Item>
                            <ActionList.Item variant="danger">
                              <ActionList.LeadingVisual>
                                <TrashIcon />
                              </ActionList.LeadingVisual>
                              Delete
                            </ActionList.Item>
                          </ActionList>
                        </ActionMenu.Overlay>
                      </ActionMenu>
                    </Box>
                    <Box>
                      <ActionMenu>
                        <ActionMenu.Button variant="invisible" size="small">Layout</ActionMenu.Button>
                        <ActionMenu.Overlay width="medium">
                          <ActionList>
                            <ActionList.Item onSelect={e => setLayoutVariant('blank')}>
                              Blank
                              <ActionList.LeadingVisual>{ layoutVariant === 'blank' && <CheckIcon/> }</ActionList.LeadingVisual>
                              <ActionList.Description variant="block">
                                A blank layout to start easy.
                              </ActionList.Description>
                              <ActionList.TrailingVisual>⌘B</ActionList.TrailingVisual>
                            </ActionList.Item>
                            <ActionList.Item onSelect={e => setLayoutVariant('simple')}>
                              Simple
                              <ActionList.LeadingVisual>{ layoutVariant === 'simple' && <CheckIcon/> }</ActionList.LeadingVisual>
                              <ActionList.Description variant="block">
                                A simple and effective layout to share your insights.
                              </ActionList.Description>
                              <ActionList.TrailingVisual>⌘S</ActionList.TrailingVisual>
                            </ActionList.Item>
                            <ActionList.Item onSelect={e => setLayoutVariant('article')}>
                              Article
                              <ActionList.LeadingVisual> { layoutVariant === 'article' && <CheckIcon/> }</ActionList.LeadingVisual>
                              <ActionList.Description variant="block">
                                Create a brand new article with a fresh image and checkout this dashboard.
                              </ActionList.Description>
                              <ActionList.TrailingVisual>⌘A</ActionList.TrailingVisual>
                            </ActionList.Item>
                          </ActionList>
                        </ActionMenu.Overlay>
                      </ActionMenu>
                    </Box>
                    <Box>
                      <ButtonGroup>
                        <Button
                          aria-label="Preview"
                          title="Preview"
                          size="small"
                          variant="invisible"
                          onClick={e => { e.preventDefault(); setShowPreview(true); }}
                          sx={{color: "rgb(36, 41, 47)"}}
                        >
                          Preview
                        </Button>
                        <Button
                          aria-label="Publish"
                          title="Publish"
                          size="small"
                          variant="invisible"
                          leadingVisual={() => <DashboardGreenIcon colored/>}
                          onClick={e => { e.preventDefault(); publishDashboard() }}
                        >
                          Publish changes
                        </Button>
                        { dashboardUrl &&
                          <Button
                            aria-label="View dashboard"
                            title="View dashboard"
                            size="small"
                            variant="primary"
                            leadingVisual={LinkExternalIcon}
                            onClick={e => { e.preventDefault(); window.open(dashboardUrl); }}
                          >
                            Open
                          </Button>
                        }
                        <Button
                          aria-label="Render classic"
                          title="Render the classic way"
                          size="small"
                          variant="invisible"
                          leadingVisual={XIcon}
                          sx={{
                            color: 'firebrick'
                          }}
                          onClick={e => { e.preventDefault(); removeDashboard(); }}
                        >
                          Close
                        </Button>
                      </ButtonGroup>
                    </Box>
                  </Box>
                }
            </Box>
          </BaseStyles>
        </ThemeProvider>
      </Portal>
      }
    </>
  );
}

export default NotebookHeader;
