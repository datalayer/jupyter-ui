
import { useState, useEffect } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box } from '@primer/react';
import { Pillar, ThemeProvider, FAQ, InlineLink, Text } from '@primer/react-brand';
import { OutputViewer } from '@datalayer/jupyter-react/lib/components/viewer/output/OutputViewer';
import { ILayout, IDashCell } from '../Types';
import { getCell } from '../Specs';

import '@primer/react-brand/lib/css/main.css'

export const NotebookSimpleLayout = (props: NotebookSimpleLayout.IConfig): JSX.Element => {
  const { notebook, layout } = props;
  const [dashCells, setDashCells] = useState<Array<IDashCell>>();
  useEffect(() => {
    const dashCells = Object.values((layout as ILayout).outputs)[0];
    setDashCells(dashCells);
  }, [notebook, layout]);
  return (
    dashCells
    ? (
      <ThemeProvider>
        <Pillar>
          <Pillar.Heading>Code search & code view</Pillar.Heading>
          <Pillar.Description>
            Enables you to rapidly search, navigate, and understand code, right with Jupyter.
          </Pillar.Description>
          <Pillar.Link href="https://jupyter.org">Learn more</Pillar.Link>
        </Pillar>
        { dashCells.map((dashCell, index) => {
          const cell = getCell(dashCell.cellId, notebook);
          return (
            cell
            ?
              <Box
                sx={{
                  position: "fixed",
                  top: dashCell.pos.top + 300,
                  left: dashCell.pos.left,
                  width: dashCell.pos.width + 100,
                  height: dashCell.pos.height,
                }}
              key={index}
              >
                <OutputViewer cell={cell} />
              </Box>
            :
              <></>
            )
          })
        }
          <FAQ style={{marginTop: layout.metadata.dashboardHeight}}>
            <FAQ.Heading>Frequently asked questions</FAQ.Heading>
            <FAQ.Item>
              <FAQ.Question>
                What&apos;s included in the GitHub for Startups offer?
              </FAQ.Question>
              <FAQ.Answer>
                <p>
                  All GitHub for Startups companies receive up to 20 seats of GitHub
                  Enterprise for free for year one and 50% off year two. Learn more
                  about the features and capabilities of GitHub Enterprise{' '}
                  <InlineLink
                    href="https://www.github.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    here
                  </InlineLink>
                  .
                </p>
              </FAQ.Answer>
            </FAQ.Item>
            <FAQ.Item>
              <FAQ.Question>Who is eligible to apply?</FAQ.Question>
              <FAQ.Answer>
                <p>
                  Startups who meet the following criteria are eligible to apply for the
                  program:
                </p>
                <ol>
                  <li>
                    <Text size="300" variant="muted">
                      Must be associated with a current GitHub for Startups partner.
                    </Text>
                  </li>
                  <li>
                    <Text size="300" variant="muted">
                      Self-funded or funded (Seed-Series A)
                    </Text>
                  </li>
                  <li>
                    <Text size="300" variant="muted">
                      Not a current GitHub Enterprise customer
                    </Text>
                  </li>
                  <li>
                    <Text size="300" variant="muted">
                      Must not have previously received credits for GitHub Enterprise
                    </Text>
                  </li>
                </ol>
              </FAQ.Answer>
            </FAQ.Item>
            <FAQ.Item>
              <FAQ.Question>
                What if my startup is not eligible? Are there other resources for me?
              </FAQ.Question>
              <FAQ.Answer>
                <p>
                  If you’re not currently eligible for the GitHub for Startups but would
                  like to try GitHub Enterprise, please feel to sign up for a trial
                  <InlineLink
                    href="https://www.github.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    here
                  </InlineLink>.
                </p>
              </FAQ.Answer>
            </FAQ.Item>
            <FAQ.Item>
              <FAQ.Question>
                How can my organization become a GitHub for Startups partner?
              </FAQ.Question>
              <FAQ.Answer>
                <p>
                  Any investor, accelerator, or startup support organization is eligible
                  to apply for the GitHub for Startups program.
                </p>
                <p>
                  <InlineLink
                    href="https://www.github.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply here
                  </InlineLink>
                  .
                </p>
              </FAQ.Answer>
            </FAQ.Item>
          </FAQ>
      </ThemeProvider>
    )
    : <></>
  )
}

export namespace NotebookSimpleLayout {

  export type IConfig = {
    notebook: INotebookContent,
    layout: ILayout,
  }

}

export default NotebookSimpleLayout;
