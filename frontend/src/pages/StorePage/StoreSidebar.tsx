interface Props {
  feeds: {
    category: {
      id: string;
      name: string;
    };
    totalInCategory: number;
    items: {
      id: string;
      name: string;
      price: number;
    }[];
  }[];
}

export default function StoreSidebar({ feeds }: Props) {
  return (
    <aside style={{ width: 280 }}>
      {feeds.map(feed => (
        <div key={feed.category.id} style={{ marginBottom: 24 }}>
          <h4>{feed.category.name}</h4>

          {feed.items.map(item => (
            <div key={item.id}>
              {item.name} – {item.price} MT
            </div>
          ))}

          {feed.totalInCategory > feed.items.length && (
            <small>Ver mais</small>
          )}
        </div>
      ))}
    </aside>
  );
}
