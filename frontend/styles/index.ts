import defaultStyles, { TIERS as defaultTiers } from './default';
import vibrantStyles, { TIERS as vibrantTiers } from './vibrant';
import pinkLoveStyles, { TIERS as pinkLoveTiers } from './pinklove';

const stylesMap: { [key: string]: { styles: any; TIERS: { label: string; color: string }[] } } = {
  default: { styles: defaultStyles, TIERS: defaultTiers },
  vibrant: { styles: vibrantStyles, TIERS: vibrantTiers },
  pinklove: { styles: pinkLoveStyles, TIERS: pinkLoveTiers },
};

export default stylesMap;
