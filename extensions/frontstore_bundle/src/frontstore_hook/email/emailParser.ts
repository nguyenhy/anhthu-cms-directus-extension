import { Liquid, RenderOptions, Template } from "liquidjs";

// Define generic structure for email assets inputs
export interface EmailAssetTemplates {
  html: string;
  subject: string;
  preview: string;
}

// Define constraints for the passed variables
export interface EmailVariablesConstraint<
  H extends Record<string, string>,
  S extends Record<string, string>,
  P extends Record<string, string>,
> {
  html: H;
  subject: S;
  preview: P;
}

export const useParseEmailTemplate = <
  H extends Record<string, string>,
  S extends Record<string, string>,
  P extends Record<string, string>,
  T extends EmailVariablesConstraint<H, S, P> = EmailVariablesConstraint<
    H,
    S,
    P
  >,
>(
  liquid: Liquid,
  templates: EmailAssetTemplates,
) => {
  // Parse tokens once during initialization
  const parsedHTML: Template[] = liquid.parse(templates.html);
  const parsedSubject: Template[] = liquid.parse(templates.subject);
  const parsedPreview: Template[] = liquid.parse(templates.preview);

  const parseHtml = async (
    data: T["html"],
    renderOptions?: RenderOptions,
  ): Promise<string> => {
    return liquid.render(parsedHTML, data, renderOptions);
  };

  const parseSubject = async (
    data: T["subject"],
    renderOptions?: RenderOptions,
  ): Promise<string> => {
    return liquid.render(parsedSubject, data, renderOptions);
  };

  const parsePreview = async (
    data: T["preview"],
    renderOptions?: RenderOptions,
  ): Promise<string> => {
    return liquid.render(parsedPreview, data, renderOptions);
  };

  const parse = async (
    data: T,
    renderOptions?: RenderOptions,
  ): Promise<{ html: string; subject: string; preview: string }> => {
    const [html, subject, preview] = await Promise.all([
      parseHtml(data.html, renderOptions),
      parseSubject(data.subject, renderOptions),
      parsePreview(data.preview, renderOptions),
    ]);

    return { html, subject, preview };
  };

  return {
    parseHtml,
    parseSubject,
    parsePreview,
    parse,
  };
};
