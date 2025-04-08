import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // Fallback if env is not set
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default axios;
