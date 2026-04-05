export class AuthResponseDto {
  accessToken!: string;
  tokenType!: 'Bearer';
  expiresIn!: string;
  user!: {
    id: string;
    email: string;
    displayName: string;
  };
}
