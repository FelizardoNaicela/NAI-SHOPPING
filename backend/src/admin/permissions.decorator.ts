import { SetMetadata } from '@nestjs/common';

export const ADMIN_PERMISSION_KEY =
  'admin_permission';

export const RequirePermission = (
  permission: string,
) =>
  SetMetadata(
    ADMIN_PERMISSION_KEY,
    permission,
  );