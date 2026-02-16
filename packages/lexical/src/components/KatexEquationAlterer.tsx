/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback, useState } from 'react';
import Button from '../components/Button';
import KatexRenderer from './KatexRenderer';
import { Box, Text, Textarea, TextInput } from '@primer/react';

type Props = {
  initialEquation?: string;
  onConfirm: (equation: string, inline: boolean) => void;
};

export const KatexEquationAlterer = ({
  onConfirm,
  initialEquation = '',
}: Props): JSX.Element => {
  const [equation, setEquation] = useState<string>(initialEquation);
  const [inline, setInline] = useState<boolean>(true);
  const onClick = useCallback(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);
  const onCheckboxChange = useCallback(() => {
    setInline(!inline);
  }, [setInline, inline]);
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Text sx={{ fontSize: 1 }}>Inline</Text>
        <input type="checkbox" checked={inline} onChange={onCheckboxChange} />
      </Box>
      <Text sx={{ fontSize: 1, fontWeight: 'bold', mb: 1 }}>Equation</Text>
      <Box sx={{ mb: 2 }}>
        {inline ? (
          <TextInput
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setEquation(event.target.value);
            }}
            value={equation}
            block
          />
        ) : (
          <Textarea
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
              setEquation(event.target.value);
            }}
            value={equation}
            block
            rows={6}
          />
        )}
      </Box>
      <Text sx={{ fontSize: 1, fontWeight: 'bold', mb: 1 }}>Visualization</Text>
      <Box
        sx={{
          mb: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'border.default',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <KatexRenderer
          equation={equation}
          inline={false}
          onClick={() => null}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClick}>Confirm</Button>
      </Box>
    </>
  );
};

export default KatexEquationAlterer;
