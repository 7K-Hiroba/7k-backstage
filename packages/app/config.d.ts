export interface Config {
  /** Homepage configuration
   * @visibility frontend
   */
  homepage?: {
    /**
     * Quick links displayed on the homepage
     * @visibility frontend
     */
    quickLinks?: Array<{
      /**
       * URL for the quick link
       * @visibility frontend
       */
      url: string;
      /**
       * Display label
       * @visibility frontend
       */
      label: string;
      /**
       * Icon identifier (e.g. 'catalog')
       * @visibility frontend
       */
      icon?: string;
      /**
       * URL to an icon image
       * @visibility frontend
       */
      iconUrl?: string;
    }>;
  };

  /**
   * Feature flags used to toggle frontend UI and backend plugin registration.
   * All flags default to true when unset.
   * @visibility frontend
   */
  features?: {
    /**
     * /search page + sidebar search
     * @visibility frontend
     */
    search?: boolean;
    /**
     * /api-docs page, sidebar APIs, entity API tabs
     * @visibility frontend
     */
    apiDocs?: boolean;
    /**
     * /docs pages, sidebar Docs, entity Docs tabs
     * @visibility frontend
     */
    techDocs?: boolean;
    /**
     * /create pages + sidebar Create
     * @visibility frontend
     */
    scaffolder?: boolean;
    /**
     * /tech-radar page + sidebar item
     * @visibility frontend
     */
    techRadar?: boolean;
    /**
     * /catalog-graph page, sidebar Graph, entity graph cards
     * @visibility frontend
     */
    catalogGraph?: boolean;
    /**
     * /catalog-import page
     * @visibility frontend
     */
    catalogImport?: boolean;
    /**
     * entity Kubernetes tabs
     * @visibility frontend
     */
    kubernetes?: boolean;
    /**
     * entity Kro tabs/cards
     * @visibility frontend
     */
    kro?: boolean;
    /**
     * entity CI/CD tab (Argo Workflows)
     * @visibility frontend
     */
    argoWorkflows?: boolean;
    /**
     * entity overview Argo CD card
     * @visibility frontend
     */
    argocd?: boolean;
    /**
     * CAIPE Agent Forge chat assistant
     * @visibility frontend
     */
    agentForge?: boolean;
  };
}
