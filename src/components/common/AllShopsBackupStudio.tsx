import React from 'react';
import { ShopBackupStudio } from './ShopBackupStudio';

interface AllShopsBackupStudioProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

/**
 * AllShopsBackupStudio re-exports ShopBackupStudio to ensure isolated, shop-by-shop backup & restore.
 */
export const AllShopsBackupStudio: React.FC<AllShopsBackupStudioProps> = (props) => {
  return <ShopBackupStudio {...props} />;
};

export { ShopBackupStudio };
