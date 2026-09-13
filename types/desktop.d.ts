export {};

declare global {
  interface Window {
    cashflowDesktop?: {
      isDesktop?: boolean;
      openExternal?: (url: string) => Promise<boolean>;
    };
  }
}
