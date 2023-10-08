import { Stack, Card } from '@primer/react-brand';
import { DashboardGreenIcon } from '@datalayer/icons-react';
import appState from "../state/mobx";

const DashboardTab = (): JSX.Element => {
  return (
    <>
      <Stack
        direction="horizontal"
        alignItems="center"
        justifyContent="center"
        gap="normal"
      >
        <Card href="" ctaText="View dashboard" onClick={e => {e.preventDefault(); appState.setTab(1)}}>
          <Card.Icon icon={() => <DashboardGreenIcon/>} color="indigo" hasBackground />
          <Card.Heading>Dashboard 1</Card.Heading>
          <Card.Description>
            Everything you need to know about getting started with data analysis.
          </Card.Description>
        </Card>
        <Card href="" ctaText="View dashboard" onClick={e => {e.preventDefault(); appState.setTab(2)}}>
          <Card.Icon icon={() => <DashboardGreenIcon/>} color="purple" hasBackground />
          <Card.Heading>Dashboard 2</Card.Heading>
          <Card.Description>
            Everything you need to know about getting started with data analysis.
          </Card.Description>
        </Card>
        <Card href="" ctaText="View dashboard" onClick={e => {e.preventDefault(); appState.setTab(3)}}>
          <Card.Icon icon={() => <DashboardGreenIcon/>} color="teal" hasBackground />
          <Card.Heading>Dashboard 3</Card.Heading>
          <Card.Description>
            Everything you need to know about getting started with data analysis.
          </Card.Description>
        </Card>
      </Stack>
    </>
  );
};

export default DashboardTab;
