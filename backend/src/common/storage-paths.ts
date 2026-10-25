
import { resolve } from 'path';

/**
 * Diretório-base para os ficheiros persistentes.
 *
 * Localmente, por omissão, utiliza a raiz do backend.
 * No Render, STORAGE_ROOT poderá apontar para o disco persistente,
 * por exemplo: /var/data.
 */
export const STORAGE_ROOT = resolve(
  process.env.STORAGE_ROOT || process.cwd(),
);

/**
 * Diretório dos uploads públicos:
 * imagens, avatares, ficheiros de chat, etc.
 */
export const UPLOADS_DIR = resolve(
  STORAGE_ROOT,
  'uploads',
);

/**
 * Diretório das evidências legais encriptadas.
 *
 * Não deve ser disponibilizado através da rota pública /uploads.
 */
export const LEGAL_EVIDENCE_DIR = resolve(
  STORAGE_ROOT,
  'legal-evidence',
);
