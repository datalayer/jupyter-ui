import { color0, color1, color2, color3, color4, color5, color6, color7 } from './Theme';

const Layers = () => (
  <svg xmlns="http://www.w3.org/2000/layers" width="100%" height="30">
    <linearGradient id="a">
      <stop offset="0" stopColor={color0} />
      <stop offset="1" stopColor={color1} />
    </linearGradient>
    <linearGradient id="b">
      <stop offset="0" stopColor={color2} />
      <stop offset=".5" stopColor={color3 }/>
      <stop offset="1" stopColor={color4} />
    </linearGradient>
    <linearGradient id="c">
      <stop offset="0" stopColor={color5} />
      <stop offset=".5" stopColor={color6} />
      <stop offset="1" stopColor={color7} />
    </linearGradient>
    <rect fill="url(#a)" width="100%" height="30" />
    <rect fill="url(#b)" width="100%" height="20" />
    <rect fill="url(#c)" width="100%" height="10" />
  </svg>
)

export default Layers;
