import { useState, useEffect } from 'react';
import { Box, Avatar, AvatarPair, Tooltip } from '@primer/react';
import { User } from '@jupyterlab/services';
import { AlienIcon } from '@datalayer/icons-react';
import { JupyterFrontEndProps } from './plugin';

const COLORS = {
  "--jp-collaborator-color1": "#ffad8e",
  "--jp-collaborator-color2": "#dac83d",
  "--jp-collaborator-color3": "#72dd76",
  "--jp-collaborator-color4": "#00e4d0",
  "--jp-collaborator-color5": "#45d4ff",
  "--jp-collaborator-color6": "#e2b1ff",
  "--jp-collaborator-color7": "#ff9de6",
}

const toColor = (identity: User.IIdentity) => {
  const cssVariableName = identity.color
  const color = (COLORS as any)[cssVariableName.replaceAll('var(', '').replaceAll(')', '')];
  return color;
}

const IdentityView = (props: { identity: User.IIdentity | null }) => {
  const { identity } = props;
  const color = toColor(identity!);
  return (
    identity && (
      <>
        <Tooltip aria-label={identity.display_name}>
          <Box>
            <AvatarPair sx={{width: 30}}>
              <AlienIcon size={30} color={color}/>
              <Avatar src="https://avatars.githubusercontent.com/datalayer" sx={{width: 10, height: 10}} />
            </AvatarPair>
          </Box>
        </Tooltip>
      </>
    )
  )
}

const Identity = (props: JupyterFrontEndProps) => {
  const { app } = props;
  const [user, setUser] = useState<User.IManager>();
  useEffect(() => {
    if (app) {
      const user = app.serviceManager.user;
      setUser(user);
    }
  })
  return (
    <>
      { user &&
        <>
          <IdentityView identity={user.identity}/>
        </>
      }
    </>
  )
}

export default Identity;
