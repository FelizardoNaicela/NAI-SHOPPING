
import {
  FaBoxOpen,
  FaStore,
  FaBell,
} from 'react-icons/fa';
import { FaUserPlus } from 'react-icons/fa';
import type { NotificationType } from './types';

export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'NEW_PRODUCT':
      return <FaBoxOpen size={18} />;

    case 'BANCA_CREATED':
      return <FaStore size={18} />;

      case 'BANCA_FOLLOWED':
  return <FaStore size={18} />;

  case 'STORE_FOLLOWED':
  return <FaUserPlus size={18} />;
    default:
      return <FaBell size={18} />;
  }
}
