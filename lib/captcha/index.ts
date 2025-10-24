export async function getCaptchaTokenRegistrationOld(
  action: string
): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof grecaptcha === "undefined") {
      resolve(null);
      return;
    }
    grecaptcha.ready(async () => {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        resolve(null);
        return;
      }
      const token = await grecaptcha.execute(siteKey, {
        action,
      });
      resolve(token);
    });
  });
}

export async function getCaptchaTokenRegistration(
  action: string
): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof grecaptcha === "undefined") {
      resolve(null);
      return;
    }
    grecaptcha.enterprise.ready(async () => {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        resolve(null);
        return;
      }
      const token = await grecaptcha.enterprise.execute(siteKey, {
        action,
      });
      resolve(token);
    });
  });
}
