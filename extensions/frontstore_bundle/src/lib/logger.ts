export interface Logger {
  uid: number;
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}
export interface LoggerOption {
  consoleInfo: (...args: unknown[]) => void;
  consoleError: (...args: unknown[]) => void;
  _uid?: number;
}
export const createLogger = (options: LoggerOption): Logger => {
  const uid = options._uid || Math.floor(Math.random() * 10000000) + Date.now();

  const infoLogger = (...args: unknown[]) => {
    options.consoleInfo(
      //
      "[INF]",
      new Date().toISOString(),
      uid,
      ...args,
    );
  };

  const errorLogger = (...args: unknown[]) => {
    options.consoleError(
      //
      "[ERR]",
      new Date().toISOString(),
      uid,
      ...args,
    );
  };

  return {
    uid,
    info: infoLogger,
    error: errorLogger,
  };
};
