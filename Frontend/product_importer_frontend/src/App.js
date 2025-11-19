import './index.css';
import CSVUploader from "./components/CSVUploader";
import ProductManagement from './components/ProductManagement';
import WebhookManagement from './components/WebhookManagement';

function App() {
  return (
    <div className="App">
        <CSVUploader />
        <ProductManagement />
        <WebhookManagement />
    </div>
  );
}

export default App;
