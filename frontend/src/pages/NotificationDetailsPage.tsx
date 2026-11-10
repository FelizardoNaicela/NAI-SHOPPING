
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../services/api';
import styles from './NotificationDetailsPage.module.css';

interface ReportDetails {
  id: string;
  targetType: string;
  status: 'RESOLVED' | 'REJECTED';
  createdAt: string;
  reviewedAt: string | null;
}

interface AdministrativeActionDetails {
  id: string;
  type:
    | 'WARNING'
    | 'CONTENT_REMOVAL'
    | 'TEMPORARY_SUSPENSION'
    | 'PERMANENT_SUSPENSION';

  status:
    | 'ACTIVE'
    | 'COMPLETED'
    | 'REVERSED'
    | 'EXPIRED'
    | 'CANCELLED';

  targetType: string;
  targetId: string;
  startsAt: string | null;
  endsAt: string | null;
  reversedAt: string | null;
  createdAt: string;
  storeName: string | null;
}

interface NotificationDetails {
  notificationId: string;
  type: string;
  message: string;
  createdAt: string;
  report?: ReportDetails;
  administrativeAction?: AdministrativeActionDetails;
  content?: RemovedContent | null;
}

interface RemovedProductImage {
  id: string;
  originalUrl: string;
  largeUrl: string | null;
  mediumUrl: string | null;
  thumbUrl: string | null;
  webpUrl: string | null;
  isCover: boolean;
  order: number;
}

interface RemovedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface RemovedContent {
  kind: 'POST' | 'PRODUCT';
  id: string;
  text?: string | null;
  type?: string;
  name?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  createdAt: string;
  images: string[] | RemovedProductImage[];
  product?: RemovedProduct | null;
}

const actionLabels: Record<string, string> = {
  WARNING: 'Advertência',
  CONTENT_REMOVAL: 'Remoção de conteúdo',
  TEMPORARY_SUSPENSION: 'Suspensão temporária',
  PERMANENT_SUSPENSION: 'Suspensão permanente',
};

const targetLabels: Record<string, string> = {
  STORE: 'Banca',
  PRODUCT: 'Produto',
  POST: 'Publicação',
  USER: 'Conta de utilizador',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activa',
  COMPLETED: 'Concluída',
  REVERSED: 'Revertida',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

function formatDate(value?: string | null) {
  if (!value) return 'Não disponível';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Não disponível';
  }

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

export default function NotificationDetailsPage() {
  const { notificationId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] =
    useState<NotificationDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchDetails() {
      if (!notificationId) {
        setError('Notificação inválida.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await api.get<NotificationDetails>(
          `/notifications/${notificationId}/details`,
        );

        if (!cancelled) {
          setDetails(response.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          const status = err.response?.status;

          if (status === 404) {
            setError(
              'Não foi possível encontrar os detalhes desta notificação.',
            );
          } else if (status === 403) {
            setError(
              'Não tens autorização para consultar estes detalhes.',
            );
          } else {
            setError(
              'Ocorreu um erro ao carregar os detalhes. Tenta novamente.',
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [notificationId]);

  
function renderRemovedContent(content: RemovedContent) {
  const isPost = content.kind === 'POST';

  const productImages = !isPost
    ? (content.images as RemovedProductImage[]).map(
        (image) =>
          image.largeUrl ||
          image.mediumUrl ||
          image.webpUrl ||
          image.originalUrl ||
          image.thumbUrl,
      )
    : [];

  const postImages = isPost
    ? (content.images as string[])
    : [];

  const images = isPost
    ? postImages
    : productImages;

  const mainImage = isPost
    ? null
    : content.imageUrl;

  const allImages = [
    ...(mainImage ? [mainImage] : []),
    ...images.filter(
      (url): url is string =>
        Boolean(url) && url !== mainImage,
    ),
  ];

  return (
    <section className={styles.detailsCard}>
      <h3>
        {isPost
          ? 'Publicação removida'
          : 'Produto removido'}
      </h3>

      <div className={styles.removedContent}>
        {isPost ? (
          <>
            {content.text && (
              <p className={styles.removedText}>
                {content.text}
              </p>
            )}

            {content.product && (
              <div className={styles.removedProductInfo}>
                <strong>
                  Produto associado: {content.product.name}
                </strong>

                {content.product.description && (
                  <p>{content.product.description}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <h4>{content.name}</h4>

            {content.description && (
              <p>{content.description}</p>
            )}

            {typeof content.price === 'number' && (
              <strong>
                {content.price.toLocaleString('pt-PT')} MT
              </strong>
            )}
          </>
        )}

        {allImages.length > 0 && (
          <div className={styles.removedImages}>
            {allImages.map((url, index) => (
              <img
                key={`${url}-${index}`}
                src={url}
                alt={
                  isPost
                    ? `Imagem da publicação ${index + 1}`
                    : `Imagem do produto ${index + 1}`
                }
                loading="lazy"
              />
            ))}
          </div>
        )}

        <span className={styles.removedDate}>
          Publicado em {formatDate(content.createdAt)}
        </span>
      </div>

      <p className={styles.privacyNote}>
        Este conteúdo foi removido da plataforma por decisão
        administrativa. A pré-visualização permite identificar
        o conteúdo afectado, mas não permite voltar a publicá-lo.
      </p>
    </section>
  );
}


  function renderReportDetails(report: ReportDetails) {
    const resolved = report.status === 'RESOLVED';

    return (
      <section className={styles.detailsCard}>
        <h3>Resultado da denúncia</h3>

        <div className={styles.statusRow}>
          <span className={styles.label}>Estado</span>

          <span
            className={`${styles.status} ${
              resolved ? styles.success : styles.rejected
            }`}
          >
            {resolved ? 'Denúncia aceite' : 'Denúncia rejeitada'}
          </span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Conteúdo denunciado</span>
          <strong>
            {targetLabels[report.targetType] || 'Conteúdo'}
          </strong>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Data da denúncia</span>
          <strong>{formatDate(report.createdAt)}</strong>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Data da decisão</span>
          <strong>{formatDate(report.reviewedAt)}</strong>
        </div>

        <p className={styles.privacyNote}>
          {resolved
            ? 'A denúncia foi analisada e considerada procedente.'
            : 'Após a análise, a denúncia não foi considerada procedente.'}
        </p>
      </section>
    );
  }

  function renderAdministrativeDetails(
    action: AdministrativeActionDetails,
  ) {
    const isReversed = details?.type === 'ADMIN_ACTION_REVERSED';
    const isExpired =
      details?.type === 'ADMIN_SUSPENSION_EXPIRED';

    let heading = 'Medida administrativa';

    if (details?.type === 'ADMIN_WARNING') {
      heading = 'Advertência recebida';
    } else if (details?.type === 'CONTENT_REMOVED') {
      heading = 'Remoção de conteúdo';
    } else if (details?.type === 'ADMIN_SUSPENSION') {
      heading = 'Suspensão administrativa';
    } else if (isReversed) {
      heading = 'Medida administrativa revertida';
    } else if (isExpired) {
      heading = 'Suspensão terminada';
    }

    return (
      <section className={styles.detailsCard}>
        <h3>{heading}</h3>

        <div className={styles.detailRow}>
          <span className={styles.label}>Medida</span>
          <strong>
            {actionLabels[action.type] || 'Medida administrativa'}
          </strong>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Conteúdo afectado</span>
          <strong>
            {targetLabels[action.targetType] || 'Conteúdo'}
          </strong>
        </div>

        {action.storeName && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Banca</span>
            <strong>{action.storeName}</strong>
          </div>
        )}

        <div className={styles.detailRow}>
          <span className={styles.label}>Estado da medida</span>
          <strong>
            {statusLabels[action.status] || action.status}
          </strong>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.label}>Data de aplicação</span>
          <strong>{formatDate(action.startsAt || action.createdAt)}</strong>
        </div>

        {action.endsAt && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Data de término</span>
            <strong>{formatDate(action.endsAt)}</strong>
          </div>
        )}

        {action.reversedAt && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Data da reversão</span>
            <strong>{formatDate(action.reversedAt)}</strong>
          </div>
        )}

        <p className={styles.privacyNote}>
          {isReversed
            ? 'Esta medida administrativa foi revertida.'
            : isExpired
              ? 'O período da suspensão terminou.'
              : details?.type === 'ADMIN_WARNING'
                ? 'Recebeste uma advertência relacionada com a actividade na plataforma. Consulta e respeita as regras do NAI-SHOPPING.'
                : details?.type === 'CONTENT_REMOVED'
                  ? 'Um conteúdo associado à tua banca foi removido da plataforma.'
                  : 'Foi aplicada uma medida administrativa que afecta a tua conta ou banca.'}
        </p>
      </section>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => navigate('/notifications')}
      >
        ← Voltar às notificações
      </button>

      <div className={styles.header}>
        <h2>Detalhes da notificação</h2>
        <p>Consulta as informações relacionadas com esta notificação.</p>
      </div>

      {loading && (
        <div className={styles.stateMessage}>
          A carregar detalhes...
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorBox}>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && details && (
        <>
          <section className={styles.messageCard}>
            <span className={styles.date}>
              {formatDate(details.createdAt)}
            </span>

            <p>{details.message}</p>
          </section>

          {details.report && renderReportDetails(details.report)}

          {details.administrativeAction &&
            renderAdministrativeDetails(details.administrativeAction)}

            {details.content && renderRemovedContent(details.content)}
        </>
      )}
    </div>
  );
}
