export type JwtPayload = {
  sub: string;
  tenantId: string;
  roleKeys: string[];
  scope?: {
    type: 'zone' | 'group' | 'church';
    id: string;
  };
  exp?: number;
};
