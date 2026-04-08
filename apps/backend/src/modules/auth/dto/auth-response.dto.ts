export class AuthResponseDto {
  accessToken!: string;
  tokenType!: 'Bearer';
  expiresIn!: string;
  user!: {
    id: string;
    email: string;
    displayName: string;
    systemRoles: string[];
    systemPermissions: string[];
    currentChurchId: string | null;
    churchMemberships: Array<{
      churchId: string;
      roleCode: string;
      permissions: string[];
    }>;
  };
}
