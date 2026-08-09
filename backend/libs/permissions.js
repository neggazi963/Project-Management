// Hiérarchie des rôles projet : plus l'index est élevé, plus le rôle a de droits.
const ROLE_LEVELS = {
  viewer: 0,
  contributor: 1,
  manager: 2,
};

/**
 * Retourne le rôle de l'utilisateur dans ce projet, ou null s'il n'est pas membre.
 */
export const getProjectRole = (project, userId) => {
  const member = project.members.find(
    (m) => m.user.toString() === userId.toString(),
  );
  return member ? member.role : null;
};

/**
 * Vérifie que l'utilisateur a au moins le rôle minRole dans ce projet.
 * Retourne { allowed: boolean, role: string | null }.
 */
export const hasProjectPermission = (project, userId, minRole) => {
  const role = getProjectRole(project, userId);
  if (!role) return { allowed: false, role: null };

  const allowed = ROLE_LEVELS[role] >= ROLE_LEVELS[minRole];
  return { allowed, role };
};
