import { useState, useEffect } from 'react';
import LuminoDetached from '../../lumino/LuminoDetached';
import DialogAdapter from './DialogAdapter';

const DialogLumino = () => {
  const [dialogLumino, _] = useState(new DialogAdapter());
  useEffect(() => {
    dialogLumino.dialog.launch().then(success => success)
  }, []);
  return <LuminoDetached>{dialogLumino.dialog}</LuminoDetached>
}

export default DialogLumino;
