/* Copyright 2021, Prosemirror Adapter by Mirone. */

import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Editor } from './components/Editor'

const root$ = document.getElementById('app')
if (!root$)
  throw new Error('No root element found')

const root = createRoot(root$)

root.render(
    <StrictMode>
        <h1>Prosemirror Adapter React</h1>
        <ProsemirrorAdapterProvider>
            <Editor />
        </ProsemirrorAdapterProvider>
    </StrictMode>,
)
