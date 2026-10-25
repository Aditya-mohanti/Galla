import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from './theme';

// Lucide-style line icons, 2px stroke. No emoji anywhere in the UI.
const PATHS = {
  back: <Path d="M15 18l-6-6 6-6" />,
  chevronRight: <Path d="M9 18l6-6-6-6" />,
  chevronDown: <Path d="M6 9l6 6 6-6" />,
  close: <Path d="M18 6L6 18M6 6l12 12" />,
  search: (<><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /></>),
  searchMinus: (<><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5M8 11h6" /></>),
  box: (<><Path d="M21 8l-9-5-9 5 9 5 9-5z" /><Path d="M3 8v8l9 5 9-5V8M12 13v8" /></>),
  home: <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  buy: <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  sell: <Path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  menu: <Path d="M4 6h16M4 12h16M4 18h16" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  check: <Path d="M5 12l5 5 9-10" />,
  lock: (<><Rect x="5" y="11" width="14" height="10" rx="2" /><Path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  alertCircle: (<><Circle cx="12" cy="12" r="9" /><Path d="M12 7v6M12 16.5v.5" /></>),
  alertTriangle: (<><Path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><Path d="M12 9v4M12 17v.5" /></>),
  wifiOff: <Path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M14.9 10.3A10 10 0 0 1 19 12.9M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5a15 15 0 0 1 11.3 3.8M12 20h.01" />,
  cloudDown: (<><Path d="M20 16.6A4.5 4.5 0 0 0 17.5 8h-1.3A7 7 0 1 0 4 14.9" /><Path d="M12 12v9M8 17l4 4 4-4" /></>),
  cloudCheck: (<><Path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 0 1 0 9z" /><Path d="M9.5 14l2 2 4-4" /></>),
  store: (<><Path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18" /><Path d="M9 20v-6h6v6" /></>),
  laptop: (<><Rect x="4" y="5" width="16" height="11" rx="1" /><Path d="M2 20h20" /></>),
  house: (<><Path d="M3 11l9-7 9 7" /><Path d="M5 10v10h14V10M10 20v-5h4v5" /></>),
  sort: <Path d="M3 6h13M3 12h9M3 18h5M17 10v10M14 17l3 3 3-3" />,
  more: (<><Circle cx="12" cy="5" r="1" /><Circle cx="12" cy="12" r="1" /><Circle cx="12" cy="19" r="1" /></>),
  camera: (<><Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><Circle cx="12" cy="13.5" r="3.5" /></>),
  share: (<><Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" /><Path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>),
  trash: <Path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />,
  pencil: <Path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  sliders: (<><Path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><Circle cx="16" cy="7" r="2" /><Circle cx="10" cy="17" r="2" /></>),
  bell: <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />,
  backspace: (<><Path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" /><Path d="M17 9l-5 6M12 9l5 6" /></>),
  archive: (<><Rect x="3" y="4" width="18" height="5" rx="1" /><Path d="M5 9v10h14V9M10 13h4" /></>),
  restore: <Path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  tag: (<><Path d="M3 12V3h9l9 9-9 9-9-9z" /><Circle cx="7.5" cy="7.5" r="1.5" /></>),
  globe: (<><Circle cx="12" cy="12" r="9" /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  percent: <Path d="M19 5L5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  phone: <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  logout: <Path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9" />,
  refresh: <Path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />,
  info: (<><Circle cx="12" cy="12" r="9" /><Path d="M12 11v6M12 7.5v.5" /></>),
  circle: <Circle cx="12" cy="12" r="9" />,
  checkCircle: (<><Circle cx="12" cy="12" r="9" /><Path d="M8 12l3 3 5-6" /></>),
  list: <Path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, color = colors.text, strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}
