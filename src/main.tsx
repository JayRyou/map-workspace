import { createRoot } from 'react-dom/client';
import App from './WorkspaceApp.tsx';
import '@xyflow/react/dist/style.css';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);

