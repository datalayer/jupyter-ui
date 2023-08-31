/* Copyright 2021, Prosemirror Adapter by Mirone. */
import { useWidgetViewContext } from '@prosemirror-adapter/react'

export const Hashes = () => {
  const { spec } = useWidgetViewContext()
  const level = spec?.level
  const hashes = Array(level || 0).fill('#').join('')

  return <span style={{ color: 'blue', marginRight: 6 }}>{hashes}</span>
}
