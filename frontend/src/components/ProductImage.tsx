type Props = {
  src?: string | null;
  alt?: string;
  height?: number;
};

export default function ProductImage({
  src,
  alt = 'Produto',
  height = 220,
}: Props) {
  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#f6f6f6',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={src || '/placeholder.png'}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain', // 👈 mostra imagem inteira
        }}
      />
    </div>
  );
}
