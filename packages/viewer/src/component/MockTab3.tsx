import {
  Box,
  Popover,
  Button,
  Heading,
  Text
} from '@primer/react';

const MockTab3 = (): JSX.Element => {
  return (
    <>
      <Box style={{width: 300, paddingTop: 20}}>
        <Box justifyContent="center" display="flex">
          <Button variant="primary">Hello!</Button>
        </Box>
        <Popover relative open={true} caret="top">
          <Popover.Content sx={{mt: 2}}>
            <Heading sx={{fontSize: 2}}>Popover heading</Heading>
            <Text as="p">Message about this particular piece of UI.</Text>
            <Button>Got it!</Button>
          </Popover.Content>
        </Popover>
      </Box>
    </>
  );
};

export default MockTab3;
