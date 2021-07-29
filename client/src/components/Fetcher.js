import { NodeCollapseOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const FilterButton = React.forwardRef((props, ref) => {

const [status, setStatus] = useState('idle');
const [request, setRequest] = useState(null);
const [data, setData] = useState([]);

    useEffect(() => {
        if (!query) return;

        const fetchData = async () => {
            setStatus('fetching');
            const response = await fetch(
                `https://hn.algolia.com/api/v1/search?query=${query}`
            );
            const data = await response.json();
            setData(data.hits);
            setStatus('fetched');
        };

        fetchData();
    }, [query]);
});