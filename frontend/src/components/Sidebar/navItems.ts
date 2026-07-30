import { FiHome, FiMap } from 'react-icons/fi';
import { type SidebarItem } from './Sidebar';

export const mainSidebarItems: SidebarItem[] = [
  { name: 'Home', value: 'home', icon: FiHome, url: '/' },
  { name: 'Map', value: 'map', icon: FiMap, url: '/map' },
];
