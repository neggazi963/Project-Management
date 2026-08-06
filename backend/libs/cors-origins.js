const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];

export const isAllowedOrigin = (origin) => {
  if (!origin) return true; // requests with no origin (curl, mobile apps, server-to-server)
  if (allowedOrigins.includes(origin)) return true;

  // allow any Vercel preview deployment for this project
  if (
    /^https:\/\/project-management-svmh(-[a-z0-9]+)?\.vercel\.app$/.test(
      origin,
    )
  ) {
    return true;
  }

  return false;
};