export type ExceptionLogPayload = {
  requestId?: string;
  method?: string;
  url?: string;
  status: number;
  exceptionName: string;
  controller?: string;
  handler?: string;
  adminUserId?: string;
  message: string;
};

export type ExceptionMeta = {
  status: number;
  exceptionName: string;
  logMessage: string;
  stack?: string;
};
