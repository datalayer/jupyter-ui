import { EditorThemeRegistry, EditorLanguageRegistry, CodeMirrorEditorFactory, EditorExtensionRegistry, ybinding } from '@jupyterlab/codemirror';
import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
import { Cell, CodeCell, MarkdownCell, RawCell, CodeCellModel, MarkdownCellModel, RawCellModel } from '@jupyterlab/cells';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import { ICell, ILanguageInfoMetadata } from '@jupyterlab/nbformat';
import { createStandaloneCell, YCodeCell, YMarkdownCell, YRawCell, IYText } from '@jupyter/ydoc';
import { getMarked } from './../../notebook/marked/marked';
import Lumino from '../../../jupyter/lumino/Lumino';

type Props = {
  cell: ICell,
  languageInfo?: ILanguageInfoMetadata,
}

const themes = new EditorThemeRegistry();
const editorExtensions = () => {
  const registry = new EditorExtensionRegistry();
  for (const extensionFactory of EditorExtensionRegistry.getDefaultExtensions({ themes })) {
    registry.addExtension(extensionFactory);
  }
  registry.addExtension({
    name: 'shared-model-binding',
    factory: options => {
      const sharedModel = options.model.sharedModel as IYText;
      return EditorExtensionRegistry.createImmutableExtension(
        ybinding({
          ytext: sharedModel.ysource,
          undoManager: sharedModel.undoManager ?? undefined
        })
      );
    }
  });
  return registry;
}
const languages = new EditorLanguageRegistry();
for (const language of EditorLanguageRegistry.getDefaultLanguages()) {
  languages.addLanguage(language);
}
languages.addLanguage({
  name: 'ipythongfm',
  mime: 'text/x-ipythongfm',
  load: async () => {
    // TODO: add support for LaTeX
    const m = await import('@codemirror/lang-markdown');
    return m.markdown({
      codeLanguages: (info: string) => languages.findBest(info) as any
    });
  }
});
const rendermime = new RenderMimeRegistry({
  initialFactories,
  latexTypesetter: new MathJaxTypesetter(),
  markdownParser: getMarked(languages),
});
const factoryService = new CodeMirrorEditorFactory({
  extensions: editorExtensions(),
  languages,
});

export const InputViewer = (props: Props) => {
  const { cell, languageInfo } = props;
  switch(cell.cell_type) {
    case 'code': {
      const codeCell = new CodeCell({
        rendermime,
        model: new CodeCellModel({
          sharedModel: createStandaloneCell(cell) as YCodeCell
        }),
        editorConfig: {
          readOnly: true,
        },
        contentFactory: new Cell.ContentFactory({
          editorFactory: factoryService.newInlineEditor.bind(factoryService)
        })
      }).initializeState();
      if (languageInfo && languageInfo.mimetype) {
        codeCell.model.mimeType = languageInfo.mimetype;
      }
      return (
        <>
          <Lumino>{codeCell}</Lumino>
        </>
      );
    }
    case 'markdown': {
      const markdownCell = new MarkdownCell({
        rendermime,
        showEditorForReadOnlyMarkdown: false,
        model: new MarkdownCellModel({
          sharedModel: createStandaloneCell(cell) as YMarkdownCell
        }),
        contentFactory: new Cell.ContentFactory({
          editorFactory: factoryService.newInlineEditor.bind(factoryService)
        })
      }).initializeState();
      return (
        <>
          <Lumino>{markdownCell}</Lumino>
        </>
      );
    }
    case 'raw': {
      const rawCell = new RawCell({
        model: new RawCellModel({
          sharedModel: createStandaloneCell(cell) as YRawCell
        }),
        contentFactory: new Cell.ContentFactory({
          editorFactory: factoryService.newInlineEditor.bind(factoryService)
        })
      });
      return (
        <>
          <Lumino>{rawCell}</Lumino>
        </>
      );
    }
    default: {
      return <></>
    }
  }

}

export default InputViewer;
