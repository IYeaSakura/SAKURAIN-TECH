// Manual deployment configuration
// Edit this file directly when switching deployment modes.

export const deploymentConfig = {
  mode: 'edgeone',
  useWindowLocation: false,
  useNavigate: false,
} as const;

export type DeploymentMode = typeof deploymentConfig.mode;
