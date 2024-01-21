import React from 'react'

const FRAME_STYLE = {
  border: '1px solid #aaa',
}

/**
 * Embeds a Storybook example
 *
 * @param story The story ID to display
 * @param args The story arguments
 */
export function StorybookView({ story = '', args }: any) {
  let queryArgs = '';
  if (args) {
    const params = Object.entries(args).map(([k, v]: any) => `${encodeURIComponent(k)}:${encodeURIComponent(v)}`).join(';')
    if (params) {
      queryArgs = `&args=${params}`
    }
  }
  return (
    <iframe
      title="Jupyter React Storybook Component"
      src={`https://jupyter-ui-storybook.datalayer.tech/iframe.html?id=${story}&viewMode=story${queryArgs}`}
      width="100%"
      height="600"
      style={FRAME_STYLE}
      allow='clipboard-write;'
    />
  )
}
