import { Stack, Card } from '@primer/react-brand';
import { OvhCloudIcon, AwsIcon, CloudGreyIcon } from '@datalayer/icons-react';
import appState from "../state";

const ClouderTab = (): JSX.Element => {
  return (
    <>
      <Stack
        direction="horizontal"
        alignItems="center"
        justifyContent="center"
        gap="normal"
      >
        <Card href="" onClick={e => {e.preventDefault(); appState.setTab(2)}}>
          <Card.Icon icon={() => <OvhCloudIcon/>} color="indigo" hasBackground />
          <Card.Heading>OVHcloud</Card.Heading>
          <Card.Description>
            Everything you need to know about getting started with OVHcloud.
          </Card.Description>
        </Card>
        <Card href="" onClick={e => {e.preventDefault(); appState.setTab(3)}}>
          <Card.Icon icon={() => <AwsIcon/>} color="purple" hasBackground />
          <Card.Heading>AWS</Card.Heading>
          <Card.Description>
            Everything you need to know about getting started with AWS.
          </Card.Description>
        </Card>
        <Card href="" onClick={e => {e.preventDefault(); appState.setTab(4)}}>
          <Card.Icon icon={() => <CloudGreyIcon/>} color="teal" hasBackground />
          <Card.Heading>About</Card.Heading>
          <Card.Description>
            Everything you need to know about getting started with Clouder.
          </Card.Description>
        </Card>
      </Stack>
    </>
  );
};

export default ClouderTab;
