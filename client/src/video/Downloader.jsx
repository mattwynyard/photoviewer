import { React, useRef, useState, useContext, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardActions, Button, Typography } from '@mui/material';
import { ProgressBar } from '../components/ProgressBar.jsx'
import { setOpenDownload, setIsDownloading } from '../state/reducers/downloadSlice';
import { AppContext} from '../context/AppContext';
import './Downloader.css'

export const Downloader = () => {

    const show = useSelector(state => state.download.showDownload)
    const req = useSelector(state => state.download.request)
    const context = useContext(AppContext)
    const dispatch = useDispatch()
    const cardRef = useRef(null);
    const [progress] = useState(0);
    const [moving, setMoving] = useState(false);
    const [mouseDown, setMouseDown] = useState(false)
    const [mousePosition, setMousePosition] = useState(null);

    const download = useCallback(async (download) => {
        console.log(download)
        if(!req) return;
        dispatch(setIsDownloading(download))
        const query = {
            query: JSON.stringify(req),
            download: download,
          }
        const queryParams = new URLSearchParams(query)
            const response = await fetch(`https://${context.login.host}/download?${queryParams.toString()}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json', 
            "authorization": context.login.token,       
            },
        });
        const body = await response.json();
        if (body.error) {
            alert(response.status + " " + response.statusText);
            return   
        } else {
            return body;
        }   
    }, [req])

    useEffect(async () => {
        if(!req) return;
        const body = await download(false)
        console.log(body)
    }, [req, download]);

    const mouseOverCard = useCallback(() => {
        cardRef.current.style.cursor = 'pointer';
    }, [cardRef])

    const mouseDownCard = useCallback((e) => {
        if (cardRef.current) {
            setMoving(true)
            setMouseDown(true)
            cardRef.current.style.cursor = 'move';
            setMousePosition({x: e.clientX, y: e.clientY})
        }
    },[cardRef])

    const mouseUpCard = useCallback(() => {
        if (moving) {
            setMoving(false)
            if (cardRef.current) cardRef.current.style.cursor = '';
        }
    },[cardRef, moving])

    const onMouseMove = useCallback((e) => {
        const card = cardRef.current; 
        const newX = mousePosition.x - e.clientX;
        const newY = mousePosition.y - e.clientY;
        if (card) {
            if (mouseDown && card.style.cursor === 'se-resize') {
                card.style.width = card.clientWidth - newX + "px";
                card.style.height = card.clientHeight - newY+ "px";         
            } 
            if (moving) {
                card.style.top = card.offsetTop - newY + "px";
                card.style.left = card.offsetLeft - newX + "px";
            }
            setMousePosition({x: e.clientX, y: e.clientY})
        }          
    }, [cardRef, mousePosition])

    const clickCancel = useCallback((e) => {
        e.preventDefault();
        dispatch(setOpenDownload({show:false, request: null}))
    },[dispatch])

    
    
    if (!req) return null;
    return (
        <Card 
            ref={cardRef} 
            className= {show ? "download-container" : "download-container-hide"}
            raised={true}
            onMouseOver={(e) => mouseOverCard(e)}
            onMouseDown={(e) => mouseDownCard(e)}
            onMouseUp={(e) => mouseUpCard(e)}
            onMouseMove={moving  ? (e) =>  onMouseMove(e) : null}
        > 
            <CardContent
                className="card-body"
            >
                <Typography component="div">{req.label}</Typography>
                <ProgressBar value={progress}></ProgressBar>
                
            </CardContent>  
            <CardActions>
                <Button variant="outlined" onClick={() => download(true)}>Download</Button>
                <Button 
                    variant="outlined"
                    onClick={(e) => clickCancel(e)}
                    >Cancel</Button>
            </CardActions>
        </Card>   
    );
}