export interface RawEmailMsg {
  from: string;
  to: string;
  subject: string;
  html: string;
  preview?: string;
}

export interface TemplateEmailMsg {
  from: string;
  to: string;
  templateId: string;
  variables: Record<string, string>;
}

export interface EmailSender<R, T> {
  sendRaw(msg: RawEmailMsg): Promise<R>;
  sendTemplate(msg: TemplateEmailMsg): Promise<T>;
}
