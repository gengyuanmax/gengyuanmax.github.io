import saved from './design.json';
import { validateConfig,mainDesignConfig } from '../design/settings';
validateConfig(saved);
export const design = mainDesignConfig(saved);
