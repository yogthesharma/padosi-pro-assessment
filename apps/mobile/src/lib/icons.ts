import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type FeatherName = ComponentProps<typeof Feather>['name'];

/** Category icons come from the API as strings; fall back to a neutral icon for unknown names. */
export const featherIcon = (name: string): FeatherName =>
  name in Feather.glyphMap ? (name as FeatherName) : 'grid';
