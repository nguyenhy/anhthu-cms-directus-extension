export interface EmailIdentity {
  email: string;
  name?: string;
}

export const emailIdentityToString = (identity: EmailIdentity): string => {
  return identity.name
    ? `${identity.name} <${identity.email}>`
    : identity.email;
};

export const stringToEmailIdentity = (
  identityString: string,
): EmailIdentity | null => {
  // Matches "Name <email@domain.com>" or just "email@domain.com"
  const regex = /^(?:(?<name>[^<]+)\s<)?(?<email>[^>\s]+)>?$/;
  const match = identityString.trim().match(regex);

  if (!match || !match.groups?.email) {
    return null;
  }

  const name = match.groups.name?.trim();
  const email = match.groups.email.trim();

  return name ? { name, email } : { email };
};

export const toEmailIdentity = (identity: EmailIdentity): EmailIdentity => {
  const name = (identity.name || "").trim();
  return name
    ? {
        email: identity.email,
        name: name,
      }
    : { email: identity.email };
};
