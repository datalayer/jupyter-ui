export type IDatalayerConfig = {
  /**
   * Cloud API URL
   */
  apiServerUrl: string;
  /**
   * Launcher card customization
   */
  launcher?: {
    /**
     * Card category
     */
    category: string;
    /**
     * Card name
     */
    name: string;
    /**
     * Card icon SVG URL
     */
    icon: string | null;
    /**
     * Card rank
     */
    rank: number;
  };
  /**
   * Whether to display the white labelled user interface or not.
   */
  whiteLabel: boolean;
};
