/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Box, Button, Heading, Text, Link, PageLayout, PageHeader, RadioGroup, Radio, FormControl, RelativeTime, TextInput, TextInputWithTokens, Timeline, ToggleSwitch, SegmentedControl, Label, LabelGroup, NavList, IconButton, CircleBadge, CircleOcticon, Tooltip,
} from '@primer/react';
import { DataTable, Table, SkeletonBox, Banner } from '@primer/react/experimental';
import { GitCommitIcon, HeartIcon, RocketIcon, CheckIcon } from '@primer/octicons-react';
import { Jupyter } from '../jupyter/Jupyter';
import { Colormode } from '../theme/JupyterLabColormode';
import { jupyterLabTheme as theme } from '../theme/themes';

const mockTokens = [
  {text: 'zero', id: 0},
  {text: 'one', id: 1},
  {text: 'two', id: 2},
  {text: 'three', id: 3},
  {text: 'four', id: 4},
  {text: 'five', id: 5},
  {text: 'six', id: 6},
  {text: 'seven', id: 7},
]

const now = Date.now()
const Second = 1000
const Minute = 60 * Second
const Hour = 60 * Minute
const Day = 24 * Hour
const Week = 7 * Day
const Month = 4 * Week

interface Repo {
  id: number
  name: string
  type: 'public' | 'internal'
  updatedAt: number
  securityFeatures: {
    dependabot: Array<string>
    codeScanning: Array<string>
  }
}

const data: Array<Repo> = [
  {
    id: 1,
    name: 'codeql-dca-worker',
    type: 'internal',
    updatedAt: now,
    securityFeatures: {
      dependabot: ['alerts', 'security updates'],
      codeScanning: ['report secrets'],
    },
  },
  {
    id: 2,
    name: 'aegir',
    type: 'public',
    updatedAt: now - 5 * Minute,
    securityFeatures: {
      dependabot: ['alerts'],
      codeScanning: ['report secrets'],
    },
  },
  {
    id: 3,
    name: 'strapi',
    type: 'public',
    updatedAt: now - 1 * Hour,
    securityFeatures: {
      dependabot: [],
      codeScanning: [],
    },
  },
  {
    id: 4,
    name: 'codeql-ci-nightlies',
    type: 'public',
    updatedAt: now - 6 * Hour,
    securityFeatures: {
      dependabot: ['alerts'],
      codeScanning: [],
    },
  },
  {
    id: 5,
    name: 'dependabot-updates',
    type: 'public',
    updatedAt: now - 1 * Day,
    securityFeatures: {
      dependabot: [],
      codeScanning: [],
    },
  },
  {
    id: 6,
    name: 'tsx-create-react-app',
    type: 'public',
    updatedAt: now - 1 * Week,
    securityFeatures: {
      dependabot: [],
      codeScanning: [],
    },
  },
  {
    id: 7,
    name: 'bootstrap',
    type: 'public',
    updatedAt: now - 1 * Month,
    securityFeatures: {
      dependabot: ['alerts'],
      codeScanning: [],
    },
  },
  {
    id: 8,
    name: 'docker-templates',
    type: 'public',
    updatedAt: now - 3 * Month,
    securityFeatures: {
      dependabot: ['alerts'],
      codeScanning: [],
    },
  },
]

const JupyterLabTheme = () => {
  const [colormode, setColormode] = useState<Colormode>('light');
  const [tokens, setTokens] = useState([...mockTokens].slice(0, 3))
  const [isOn, setIsOn] = useState(false);
  useEffect(() => {
    if (isOn) {
      setColormode('dark');
    } else {
      setColormode('light');
    }
  }, [isOn]);
  const onClick = useCallback(() => {
    setIsOn(!isOn);
  }, [isOn]);
  const handleSwitchChange = useCallback((on: boolean) => {
    setIsOn(on);
  }, []);
  const onTokenRemove: (tokenId: string | number) => void = (tokenId) => {
    setTokens(tokens.filter((token) => token.id !== tokenId))
  }
  return (
    <Jupyter theme={theme} colormode={colormode} startDefaultKernel>
      <PageLayout containerWidth="full" padding="normal">
        <PageLayout.Header>
          <PageHeader>
            <PageHeader.TitleArea variant="large">
              <PageHeader.Title>
                JupyterLab Theme
              </PageHeader.Title>
            </PageHeader.TitleArea>
            <PageHeader.Description>
              <Text sx={{
                fontSize: 1,
                color: 'fg.muted'
              }}>
                Relevant examples to create a data driven user interface with Datalayer.
              </Text>
            </PageHeader.Description>
            <PageHeader.Actions>
              {/* Column 1 */}
              <Text
                fontSize={2}
                fontWeight="bold"
                id="switch-label"
                display="block"
                mb={1}
              >
                { colormode === 'light' ? 'Light' : 'Dark' } Mode
              </Text>
              <ToggleSwitch
                size="small"
                onClick={onClick}
                onChange={handleSwitchChange}
                checked={isOn}
                statusLabelPosition="end"
                aria-labelledby="switch-label"
              />
            </PageHeader.Actions>
          </PageHeader>
        </PageLayout.Header>
        <PageLayout.Content>
          <Box>
            <Box>
              <Banner
                title="Info"
                description="Datalayer users are now required to enable two-factor authentication as an additional security measure."
              />
            </Box>
          </Box>
          <Box display="flex">
            <Box sx={{ width: "100%" }}>
              <Heading>Heading</Heading>
              <Box>
                <Text as="h1">Heading 1</Text>
                <Text as="h2">Heading 2</Text>
                <Text as="h3">Heading 3</Text>
                <Text>This is a text.</Text>
                <br/>
                <Link href="https://datalayer.io" target="_blank">This is a link.</Link>
                <br/>
                <Text as="h3"><Link href="https://datalayer.io" target="_blank">This is a heading 3 link</Link></Text>
              </Box>
              <Box>
                <Button variant="default">Default</Button>
                <Button variant="default" leadingVisual={RocketIcon}>Icon</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="primary" leadingVisual={RocketIcon}>Icon</Button>
                <Button variant="invisible">Invisible</Button>
                <Button variant="invisible" leadingVisual={RocketIcon}>Icon</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="danger" leadingVisual={RocketIcon}>Icon</Button>
              </Box>
              <Box>
                <NavList>
                  <NavList.Item href="#" aria-current="page">
                    Item 1
                  </NavList.Item>
                  <NavList.Item href="#">Item 2</NavList.Item>
                  <NavList.Item href="#">Item 3</NavList.Item>
                </NavList>
              </Box>
              <Box>
                <IconButton icon={HeartIcon} aria-label="Favorite" />
              </Box>
              <Box>
                <CircleOcticon
                  icon={CheckIcon}
                  sx={{backgroundColor: 'success.emphasis', color: 'fg.onEmphasis'}}
                  aria-label="Changes approved"
                />
              </Box>
              <Box>
                <CircleBadge>
                  <CircleBadge.Icon icon={RocketIcon} aria-label="Launch badge" />
                </CircleBadge>
              </Box>
            </Box>
            {/* Column 2 */}
            <Box sx={{ width: "100%" }}>
              <Box as="form">
                <RadioGroup name="defaultRadioGroup">
                  <RadioGroup.Label>Choices</RadioGroup.Label>
                  <FormControl>
                    <Radio value="one" defaultChecked />
                    <FormControl.Label>Choice one</FormControl.Label>
                  </FormControl>
                  <FormControl>
                    <Radio value="two" />
                    <FormControl.Label>Choice two</FormControl.Label>
                  </FormControl>
                  <FormControl>
                    <Radio value="three" />
                    <FormControl.Label>Choice three</FormControl.Label>
                  </FormControl>
                </RadioGroup>
              </Box>
              <Box as="form">
                <FormControl>
                  <FormControl.Label>Default label</FormControl.Label>
                  <FormControl.Caption>This is a caption</FormControl.Caption>
                  <TextInput />
                </FormControl>
              </Box>
              <Box>
                <FormControl>
                  <FormControl.Label>Default label</FormControl.Label>
                  <TextInputWithTokens tokens={tokens} onTokenRemove={onTokenRemove} />
                </FormControl>
              </Box>
              <Box>
                <SkeletonBox height="4rem" />
              </Box>
              <Box>
                <Text id="toggle" fontWeight="bold" fontSize={1}>
                  Toggle label
                </Text>
                <ToggleSwitch aria-labelledby="toggle" />
              </Box>
              <Box>
                <SegmentedControl aria-label="File view">
                  <SegmentedControl.Button defaultSelected>Preview</SegmentedControl.Button>
                  <SegmentedControl.Button>Raw</SegmentedControl.Button>
                  <SegmentedControl.Button>Blame</SegmentedControl.Button>
                </SegmentedControl>
              </Box>
              <Box>
                <Timeline>
                  <Timeline.Item>
                    <Timeline.Badge>
                      <CircleOcticon icon={GitCommitIcon} aria-label="Commit" />
                    </Timeline.Badge>
                    <Timeline.Body>This is a message</Timeline.Body>
                  </Timeline.Item>
                  <Timeline.Item>
                    <Timeline.Badge>
                      <CircleOcticon icon={GitCommitIcon} aria-label="Commit" />
                    </Timeline.Badge>
                    <Timeline.Body>This is a message</Timeline.Body>
                  </Timeline.Item>
                </Timeline>
              </Box>
              <Box>
                <Tooltip text="This is a tooltip">
                  <Button variant="default">Hover me</Button>
                </Tooltip>
              </Box>
              <Box>
                <p>Trunacte after 5 labels</p>
                <LabelGroup visibleChildCount={5}>
                  <Label>One</Label>
                  <Label>Two</Label>
                  <Label>Three</Label>
                  <Label>Four</Label>
                  <Label>Five</Label>
                  <Label>Six</Label>
                  <Label>Seven</Label>
                  <Label>Eight</Label>
                  <Label>Nine</Label>
                  <Label>Ten</Label>
                  <Label>Eleven</Label>
                  <Label>Twelve</Label>
                  <Label>Thirteen</Label>
                  <Label>Fourteen</Label>
                  <Label>Fifteen</Label>
                  <Label>Sixteen</Label>
                </LabelGroup>
                <p>Truncate labels based on container size</p>
                {/* The `Box` wrapper is just to demonstrate the behavior of `visibleChildCount="auto"` */}
                <Box
                  sx={{
                    outline: '1px solid',
                    outlineColor: 'border.default',
                    overflow: 'auto',
                    padding: '0.25rem',
                    resize: 'horizontal',
                    width: '600px',
                  }}
                >
                  <LabelGroup visibleChildCount="auto">
                    <Label variant="default">One</Label>
                    <Label variant="accent">Two</Label>
                    <Label variant="attention">Three</Label>
                    <Label variant="danger">Four</Label>
                    <Label variant="done">Five</Label>
                    <Label variant="primary">Six</Label>
                    <Label variant="secondary">Seven</Label>
                    <Label variant="severe">Eight</Label>
                    <Label variant="sponsors">Nine</Label>
                    <Label variant="success">Ten</Label>
                    <Label>Eleven</Label>
                    <Label>Twelve</Label>
                    <Label>Thirteen</Label>
                    <Label>Fourteen</Label>
                    <Label>Fifteen</Label>
                    <Label>Sixteen</Label>
                  </LabelGroup>
                </Box>
              </Box>
            </Box>
          </Box>
          <Box>
            <Table.Container>
              <Table.Title as="h2" id="repositories">
                Repositories
              </Table.Title>
              <Table.Subtitle as="p" id="repositories-subtitle">
                A subtitle could appear here to give extra context to the data.
              </Table.Subtitle>
              <DataTable
                aria-labelledby="repositories"
                aria-describedby="repositories-subtitle"
                data={data}
                columns={[
                // @ts-ignore
                  {
                    header: 'Repository',
                    field: 'name',
                    rowHeader: true,
                  },
                  {
                    header: 'Type',
                    field: 'type',
                    renderCell: (row) => {
                      return <Label>{row.type}</Label>
                    },
                  },
                  {
                    header: 'Updated',
                    field: 'updatedAt',
                    renderCell: (row) => {
                      return <RelativeTime date={new Date(row.updatedAt)} />
                    },
                  },
                  {
                    header: 'Dependabot',
                    field: 'securityFeatures.dependabot',
                    renderCell: (row) => {
                      return row.securityFeatures.dependabot.length > 0 ? (
                        <LabelGroup>
                          {row.securityFeatures.dependabot.map((feature) => {
                            return <Label key={feature}>{feature}</Label>
                          })}
                        </LabelGroup>
                      ) : null
                    },
                  },
                  {
                    header: 'Code scanning',
                    field: 'securityFeatures.codeScanning',
                    renderCell: (row) => {
                      return row.securityFeatures.codeScanning.length > 0 ? (
                        <LabelGroup>
                          {row.securityFeatures.codeScanning.map((feature) => {
                            return <Label variant="danger" key={feature}>{feature}</Label>
                          })}
                        </LabelGroup>
                      ) : null
                    },
                  },
                ]}
              />
            </Table.Container>
          </Box>
          <Box>
            <Box>
              <Text as="h3"><Link href="https://datalayer.io" target="_blank">User Guide</Link></Text>
            </Box>
            <Box>
              <Text as="h3"><Link href="https://datalayer.io" target="_blank">Pricing</Link></Text>
            </Box>
            <Box>
              <Text as="h3"><Link href="https://datalayer.io" target="_blank">Privacy</Link></Text>
            </Box>
            <Box>
              <Text as="h3"><Link href="https://datalayer.io" target="_blank">Terms and conditions</Link></Text>
            </Box>
          </Box>
        </PageLayout.Content>
      </PageLayout>
    </Jupyter>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<JupyterLabTheme />);
