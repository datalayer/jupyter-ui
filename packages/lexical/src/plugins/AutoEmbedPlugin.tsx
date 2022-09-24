/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useState} from 'react';
import type {LexicalEditor} from 'lexical';
import {
  AutoEmbedOption,
  EmbedConfig,
  EmbedMatchResult,
  EmbedMenuProps,
  LexicalAutoEmbedPlugin,
  URL_MATCHER,
} from '@lexical/react/LexicalAutoEmbedPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import useModal from './../hooks/useModal';
import Button from './../ui/Button';
import {INSERT_YOUTUBE_COMMAND} from './YouTubePlugin';

interface PlaygroundEmbedConfig extends EmbedConfig {
  // Human readable name of the embeded content e.g. Tweet or Google Map.
  contentName: string;
  // Icon for display.
  icon?: JSX.Element;
  // An example of a matching url https://twitter.com/jack/status/20
  exampleUrl: string;
  // For extra searching.
  keywords: Array<string>;
  // Embed a Figma Project.
  description?: string;
}

export const YoutubeEmbedConfig: PlaygroundEmbedConfig = {
  contentName: 'Youtube Video',
  exampleUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  // Icon for display.
  icon: <i className="icon youtube" />,
  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id);
  },
  keywords: ['youtube', 'video'],
  // Determine if a given URL is a match and return url data.
  parseUrl: (url: string) => {
    const match =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
    const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;
    if (id != null) {
      return {
        id,
        url,
      };
    }
    return null;
  },
  type: 'youtube-video',
};

export const EmbedConfigs = [
  YoutubeEmbedConfig,
];

function AutoEmbedMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: AutoEmbedOption;
}) {
  let className = 'item';
  if (isSelected) {
    className += ' selected';
  }
  return (
    <li
      tabIndex={-1}
      className={className}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      <span className="text">{option.title}</span>
    </li>
  );
}

function AutoEmbedMenu({
  options,
  selectedItemIndex,
  onOptionClick,
  onOptionMouseEnter,
}: EmbedMenuProps) {
  return (
    <ul>
      {options.map((option: AutoEmbedOption, i: number) => (
        <AutoEmbedMenuItem
          index={i}
          isSelected={selectedItemIndex === i}
          onClick={() => onOptionClick(option, i)}
          onMouseEnter={() => onOptionMouseEnter(i)}
          option={option}
        />
      ))}
    </ul>
  );
}

export function AutoEmbedDialog({
  embedConfig,
  onClose,
}: {
  embedConfig: PlaygroundEmbedConfig;
  onClose: () => void;
}): JSX.Element {
  const [text, setText] = useState('');
  const [editor] = useLexicalComposerContext();

  const urlMatch = URL_MATCHER.exec(text);
  const embedResult =
    text != null && urlMatch != null ? embedConfig.parseUrl(text) : null;

  const onClick = () => {
    if (embedResult != null) {
      embedConfig.insertNode(editor, embedResult);
      onClose();
    }
  };
  return (
    <div style={{width: '600px'}}>
      <div className="Input__wrapper">
        <input
          type="text"
          className="Input__input"
          placeholder={embedConfig.exampleUrl}
          value={text}
          data-test-id={`${embedConfig.type}-embed-modal-url`}
          onChange={(e) => {
            setText(e.target.value);
          }}
        />
      </div>
      <div className="ToolbarPlugin__dialogActions">
        <Button
          disabled={!embedResult}
          onClick={onClick}
          data-test-id={`${embedConfig.type}-embed-modal-submit-btn`}>
          Embed
        </Button>
      </div>
    </div>
  );
}

export const AutoEmbedPlugin = (): JSX.Element => {
  const [modal, showModal] = useModal();
  const openEmbedModal = (embedConfig: PlaygroundEmbedConfig) => {
    showModal(`Embed ${embedConfig.contentName}`, (onClose) => (
      <AutoEmbedDialog embedConfig={embedConfig} onClose={onClose} />
    ));
  };
  const getMenuOptions = (
    activeEmbedConfig: PlaygroundEmbedConfig,
    embedFn: () => void,
    dismissFn: () => void,
  ) => {
    return [
      new AutoEmbedOption('Dismiss', {
        onSelect: dismissFn,
      }),
      new AutoEmbedOption(`Embed ${activeEmbedConfig.contentName}`, {
        onSelect: embedFn,
      }),
    ];
  };
  return (
    <>
      {modal}
      <LexicalAutoEmbedPlugin<PlaygroundEmbedConfig>
        embedConfigs={EmbedConfigs}
        onOpenEmbedModalForConfig={openEmbedModal}
        getMenuOptions={getMenuOptions}
        menuComponent={AutoEmbedMenu}
      />
    </>
  );
}

export default AutoEmbedPlugin;
