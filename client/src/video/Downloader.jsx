import { React, useRef, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardActions, Button,} from '@mui/material';
import { ProgressBar, ProgressBarIndeterminate } from '../components/Progress.jsx'
import { setOpenDownload, setIsDownloading } from '../state/reducers/downloadSlice';
import { AppContext} from '../context/AppContext';
import './Downloader.css'
import socketIOClient from "socket.io-client";

export const Downloader = () => {
    const show = useSelector(state => state.download.showDownload)
    const req = useSelector(state => state.download.request)
    const { login } = useContext(AppContext)
    const dispatch = useDispatch()
    const cardRef = useRef(null);
    const [progress] = useState({frames: 0, MB: 0});
    const [downloadCount] = useState(0)
    const [message, setMessage] = useState('')
    const [header, setHeader] = useState(null)
    const [moving, setMoving] = useState(false);
    const [mouseDown, setMouseDown] = useState(false)
    const [mousePosition, setMousePosition] = useState(null);
    const SERVER_URL = "https://localhost:8443";
    const [socket, setSocket] = useState(null)

    const progressPercent = useMemo(() => {
        if (!header) return 0
        return Math.round(((progress.MB / header.bytes) + Number.EPSILON) * 100) / 100
    }, [progress, header])

    const download = useCallback(async () => {
        if(!req) return;
        dispatch(setIsDownloading(true))
        socket.emit('download')

        
 
    }, [req])

    useEffect(() => {
        if(!req) return
        socket.emit("header", req)
    }, [socket])

    useEffect(async () => {
        if(!req) return;
        setMessage("requesting query data....")
        const socket = socketIOClient(SERVER_URL, {
            cors: {
              origin: "https://localhost:3000",
              methods: ["GET", "HEAD"]
            },
            auth: {
                token: login.token,
                user: login.user
            },
            query: req
          });
        
        socket.on("connect", () => {
            setSocket(socket)
            console.log("connected to server")
        })
        socket.on("header", (data) => {
            const header = {
                bytes: Math.round(((data.bytes / 1000000) + Number.EPSILON) * 100) / 100,
                frames: data.count,
                min: data.minERP,
                max: data.maxERP
            }
            setMessage('')
            setHeader(header)
        });
        socket.on("connect_error", (err) => {
            console.log(err instanceof Error); 
            console.log(err.message); 
            console.log(err.data); 
          });
        socket.on("disconnect", (reason) => {
            console.log(`disconnect: ${reason}`); 
        });
    }, [req]);

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
        setHeader(null)
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
                <b>{`${req.label} (${req.side === 'L' ? 'Left' : 'Right'})`}</b>
                <p>{`carriage: ${req.cwid}`}</p>
                {header ? <p>{`erp: ${header.min}-${header.max} m`}</p> : null}
                {header ? <ProgressBar value={progressPercent}></ProgressBar> : <ProgressBarIndeterminate/>}
                {<p className='message-text'>{`${message}`}</p>}
                {header ? <p>{`${downloadCount}/${header.frames} frames ${header.bytes} MB`}
                </p> : null}
            </CardContent>  
            <CardActions className="card-actions">
                <div>
                <Button variant="outlined" disabled={!header} fullWidth={true} onClick={download}>{`${'Download'}`}</Button>
                </div>
                <div>
                <Button variant="outlined" fullWidth={true} onClick={(e) => clickCancel(e)}>{`${'Cancel'}`}</Button>
                </div>
                
                
            </CardActions>
        </Card>   
    );
}