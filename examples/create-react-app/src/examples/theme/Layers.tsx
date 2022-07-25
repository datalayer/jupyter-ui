import { color0 } from './Theme';
import { color1 } from './Theme';
import { color2 } from './Theme';
import { color3 } from './Theme';
import { color4 } from './Theme';

const Layers = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/layers" width="100%" height="20">
    <linearGradient id="a">
      <stop offset="0" stopColor={color0} />
      <stop offset="1" stopColor={color1} />
    </linearGradient>
    <linearGradient id="b">
      <stop offset="0" stopColor={color2} />
      <stop offset=".5" stopColor={color3 }/>
      <stop offset="1" stopColor={color4} />
    </linearGradient>
    <rect fill="url(#b)" width="100%" height="20" />
    <rect fill="url(#a)" width="100%" height="10" />
  </svg>
)

export default Layers;
