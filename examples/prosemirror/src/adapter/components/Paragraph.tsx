/* Copyright 2021, Prosemirror Adapter by Mirone. */
import { useNodeViewContext } from '@prosemirror-adapter/react'

export const Paragraph = () => {
  const { contentRef, selected } = useNodeViewContext()
  return <div style={{ outline: selected ? 'blue solid 1px' : 'none' }} role="presentation" ref={contentRef} />
}
