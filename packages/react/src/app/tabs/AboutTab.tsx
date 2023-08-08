import { Text } from '@primer/react';

type Props = {
  version: string,
}

const AboutTab = (props: Props): JSX.Element => {
  const { version } = props;
  return (
    <>
      <Text>Version: {version}</Text>
    </>
  );
};

export default AboutTab;
