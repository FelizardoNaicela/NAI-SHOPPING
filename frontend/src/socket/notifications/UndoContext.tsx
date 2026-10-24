import {
  createContext,
  useContext,
  useState,
  useRef,
} from 'react';

type UndoAction = {
  id: number;
  message: string;
  undo: () => void;
  commit?: () => Promise<void> | void;
  timeout: number;
};

type UndoContextType = {
  showUndo: (
    action: Omit<UndoAction, 'id'>,
  ) => void;
};

const UndoContext =
  createContext<UndoContextType | null>(null);

let idCounter = 0;

export function UndoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [undos, setUndos] = useState<UndoAction[]>([]);
  const timers = useRef<
    Map<number, ReturnType<typeof setTimeout>>
  >(new Map());

  function showUndo(
    action: Omit<UndoAction, 'id'>,
  ) {
    const id = ++idCounter;

    const fullAction: UndoAction = {
      id,
      ...action,
      timeout: action.timeout ?? 5000,
    };

    setUndos(prev => [...prev, fullAction]);

    const timer = setTimeout(async () => {
      if (fullAction.commit) {
        await fullAction.commit();
      }

      removeUndo(id);
    }, fullAction.timeout);

    timers.current.set(id, timer);
  }

  function removeUndo(id: number) {
    setUndos(prev => prev.filter(u => u.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }

  function handleUndo(id: number) {
    const action = undos.find(u => u.id === id);
    if (!action) return;

    action.undo();
    removeUndo(id);
  }

  return (
    <UndoContext.Provider value={{ showUndo }}>
      {children}

      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
        }}
      >
        {undos.map(action => (
          <div
            key={action.id}
            style={{
              background: '#111',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 240,
            }}
          >
            <span style={{ flex: 1 }}>
              {action.message}
            </span>

            <button
              onClick={() =>
                handleUndo(action.id)
              }
              style={{
                background: 'transparent',
                color: '#60a5fa',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Desfazer
            </button>
          </div>
        ))}
      </div>
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const ctx = useContext(UndoContext);
  if (!ctx) {
    throw new Error(
      'useUndo deve ser usado dentro de UndoProvider',
    );
  }
  return ctx;
}
