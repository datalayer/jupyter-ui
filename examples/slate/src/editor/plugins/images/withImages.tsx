import { Editor, Transforms } from 'slate';
import imageExtensions from 'image-extensions';
import isUrl from 'is-url';
import { ImageElement } from '../../../slate';

const isImageUrl = (url: string) => {
  if (!url) return false;
  if (!isUrl(url)) return false;
  const ext = new URL(url).pathname.split('.').pop();
  return imageExtensions.includes(ext);
}

const insertImage = (editor: Editor, url: string) => {
  const text = {text: ''};
  const image: ImageElement = {type: 'image', url, children: [text]};
  Transforms.insertNodes(editor, image);
}

const withImages = (editor: Editor) => {
  const {insertData, isVoid} = editor;
  editor.isVoid = element => {
    return element.type === 'image' ? true : isVoid(element);
  }
  editor.insertData = data => {
    const text = data.getData('text/plain');
    const {files} = data;
    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader();
        const [mime] = file.type.split('/');
        if (mime === 'image') {
          reader.addEventListener('load', () => {
            const url = reader.result;
            insertImage(editor, url as string);
          });
          reader.readAsDataURL(file);
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text);
    } else {
      insertData(data);
    }
  }
  return editor;
}

export default withImages;
