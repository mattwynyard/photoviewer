import { useEffect, useState, useContext } from 'react'
import { AppContext } from '../context/AppContext';

export default function useGetQuery(query) {

    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const { login } = useContext(AppContext)

    useEffect(async ()=> {
        try {
            const queryParams = new URLSearchParams(query)
            setLoading(true)
            const response = await fetch(`${login.host}/download?${queryParams.toString()}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json', 
            "authorization": login.token,       
            },
        });
            const body = await response.json();
            setData(body)   
        } catch (err) {
            setError(err)
        } finally {
            setLoading(false)
        }
     },[query])
     return { data, error, loading }
}