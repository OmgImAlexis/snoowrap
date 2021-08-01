export const consoleLogger = Object.freeze({
  warn (message: string, ...optionalParams: any[]) {
    // eslint-disable-next-line no-console
    console.warn('[warning]', message, ...optionalParams);
  },

  debug (message: string, ...optionalParams: any[]) {
    // eslint-disable-next-line no-console
    console.debug('[debug]', message, ...optionalParams);
  }
});

export const createConfig = () => ({
  endpointDomain: 'reddit.com',
  requestDelay: 0,
  requestTimeout: 30000,
  continueAfterRatelimitError: false,
  retryErrorCodes: [502, 503, 504, 522],
  maxRetryAttempts: 3,
  warnings: true,
  debug: false,
  logger: consoleLogger,
  proxies: true,
});
