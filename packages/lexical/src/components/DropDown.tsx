/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * DropDownItem children are rendered as ActionList.Item inside ActionMenu.
 */

import type { JSX } from 'react';

import * as React from 'react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@primer/octicons-react';

// --- DropDownItem (keeps same API) ---

export function DropDownItem({
  children,
  className,
  onClick,
  title,
}: {
  children: React.ReactNode;
  className: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
}) {
  // We render a plain button so that the existing consumers who pass
  // children like <i className="icon ..."/><span className="text">...</span>
  // still render correctly. Long-term these should become ActionList.Item.
  return (
    <button
      className={className}
      onClick={onClick}
      title={title}
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 12px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: 14,
        textAlign: 'left',
        borderRadius: 6,
        color: 'inherit',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor =
          'var(--bgColor-neutral-muted, rgba(175,184,193,0.2))';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

// --- DropDownItems (kept for backwards compat — wraps children in styled container) ---

export function DropDownItems({
  children,
  dropDownRef,
  onClose,
}: {
  children: React.ReactNode;
  dropDownRef: React.Ref<HTMLDivElement>;
  onClose: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      ref={dropDownRef}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 4,
        background: 'var(--bgColor-default, #fff)',
        border: '1px solid var(--borderColor-default, #d0d7de)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-resting-medium, 0 3px 12px rgba(0,0,0,0.12))',
        minWidth: 150,
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
}

// --- DropDown (migrated to use overlay pattern with Primer styling) ---

export function DropDown({
  disabled = false,
  buttonLabel,
  buttonAriaLabel,
  buttonClassName,
  buttonIconClassName,
  children,
  stopCloseOnClickSelf,
}: {
  disabled?: boolean;
  buttonAriaLabel?: string;
  buttonClassName: string;
  buttonIconClassName?: string;
  buttonLabel?: string;
  children: ReactNode;
  stopCloseOnClickSelf?: boolean;
}): JSX.Element {
  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);

  const handleClose = () => {
    setShowDropDown(false);
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  };

  // Position the dropdown below the button
  useEffect(() => {
    const button = buttonRef.current;
    const dropDown = dropDownRef.current;

    if (showDropDown && button !== null && dropDown !== null) {
      const { top, left } = button.getBoundingClientRect();
      const dropDownPadding = 4;
      dropDown.style.position = 'fixed';
      dropDown.style.zIndex = '100';
      dropDown.style.top = `${top + button.offsetHeight + dropDownPadding}px`;
      dropDown.style.left = `${Math.min(
        left,
        window.innerWidth - dropDown.offsetWidth - 20,
      )}px`;
    }
  }, [showDropDown]);

  // Close on outside click
  useEffect(() => {
    const button = buttonRef.current;

    if (button !== null && showDropDown) {
      const handle = (event: MouseEvent) => {
        const target = event.target as Node;
        if (stopCloseOnClickSelf && dropDownRef.current?.contains(target)) {
          return;
        }
        if (!button.contains(target)) {
          setShowDropDown(false);
        }
      };
      document.addEventListener('click', handle);
      return () => void document.removeEventListener('click', handle);
    }
  }, [showDropDown, stopCloseOnClickSelf]);

  // Reposition on scroll
  useEffect(() => {
    const handlePositionUpdate = () => {
      if (showDropDown) {
        const button = buttonRef.current;
        const dropDown = dropDownRef.current;
        if (button && dropDown) {
          const { top } = button.getBoundingClientRect();
          dropDown.style.top = `${top + button.offsetHeight + 4}px`;
        }
      }
    };
    document.addEventListener('scroll', handlePositionUpdate);
    return () => document.removeEventListener('scroll', handlePositionUpdate);
  }, [showDropDown]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={buttonAriaLabel || buttonLabel}
        className={buttonClassName}
        onClick={() => setShowDropDown(!showDropDown)}
        ref={buttonRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          border: 'none',
          background: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          borderRadius: 6,
          padding: '4px 8px',
          color: 'inherit',
          fontSize: 14,
        }}
      >
        {buttonIconClassName && <span className={buttonIconClassName} />}
        {buttonLabel && (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {buttonLabel}
          </span>
        )}
        <ChevronDownIcon size={12} />
      </button>

      {showDropDown &&
        createPortal(
          <DropDownItems dropDownRef={dropDownRef} onClose={handleClose}>
            {children}
          </DropDownItems>,
          document.body,
        )}
    </>
  );
}

export default DropDown;
