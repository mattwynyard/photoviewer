import { React, useRef, useState, useContext, useCallback, useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardActions, Button,} from '@mui/material';
import { ProgressBar, ProgressBarIndeterminate } from '../components/Progress.jsx'
import { setOpenDownload, setIsDownloading} from '../state/reducers/downloadSlice';
import { AppContext} from '../context/AppContext';
import './Downloader.css'
import socketIOClient from "socket.io-client";

export const Downloader = () => {
    const show = useSelector(state => state.download.showDownload)
    const req = useSelector(state => state.download.request)
    const { login } = useContext(AppContext)
    const dispatch = useDispatch()
    const cardRef = useRef(null);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [frames, setFrames] = useState(0);
    const [targetSize, setTargetSize] = useState(0)
    const [message, setMessage] = useState('')
    const [header, setHeader] = useState(null)
    const [moving, setMoving] = useState(false);
    const [mouseDown, setMouseDown] = useState(false)
    const [mousePosition, setMousePosition] = useState(null);
    const SERVER_URL = "https://localhost:8443";
    const [socket, setSocket] = useState(null)

    const downloadVideo = useCallback( async (filename) => {
        const query = {
            user: login.user,
            filename: filename,
            project: req.project
          }
          try {
            const queryParams = new URLSearchParams(query)
            const response = await fetch(`https://${login.host}/download?${queryParams.toString()}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'video/mp4',
                    'Content-Type': 'video/mp4', 
                    "authorization": login.token,       
                },
            });
            response.blob().then(blob => {
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                a.remove();
            });
          } catch (err) {
            console.log(err)
          } finally {
            setMessage(`video file downloaded`)
            socket.emit("delete", filename)
          }
        
    })

    const download = useCallback(async () => {
        if(!req) return;
        dispatch(setIsDownloading(true))
        setDownloading(true)
        setMessage("downloading frames...")
        socket.emit('download')
        socket.on("photo", ()=> {
            setFrames(frames => frames + 1)  
        }) 
        socket.on("stitch", ()=> {
            setMessage("building video...")       
        })
        socket.on("progress", (data)=> {
            if(!data) return
            setMessage(`building video at ${data.currentFps} fps`)
            setFrames(data.frames)
            setTargetSize(data.targetSize / 100)
              
        })
        socket.on("end", (filename) => {
            setMessage(`${filename} completed`)
            downloadVideo(filename)
        })
    }, [header])

    useEffect(() => {
        if(!header) return
        const progress = Math.round(((frames / header.frames) + Number.EPSILON) * 100)
        setProgress(progress)
    }, [frames, header])

    useEffect(() => {
        if(!req) return
        if(!socket) return
        if(downloading) return
        socket.emit("header", req)
    }, [socket, req, downloading])

    useEffect(async () => {
        if(!req) return;
        setMessage("requesting download data....")
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
            if (header) return;
            setSocket(socket)
        })
        socket.on("head", (frames)=> {
            setMessage(`requesting metadata data: found ${frames.count}/${frames.length} frames`)       
        })
        socket.on("header", (data) => {
            //if (header) return;
            const header = {
                bytes: Math.round(((data.bytes / 1000000) + Number.EPSILON) * 100) / 100,
                frames: data.count,
                min: data.minERP,
                max: data.maxERP
            }
            setMessage(`ready for download, esimated video size ${header.bytes} MB`)
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

    const close = useCallback(() => {
        setHeader(null)
        setFrames(0)
        setProgress(0)
        setDownloading(false)
        setMessage('')
        if (socket) socket.disconnect()
        dispatch(setOpenDownload({show:false, request: null}))
    }, [dispatch])

    const clickCancel = useCallback((e) => {
        e.preventDefault();
        close();
    },[])

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
                {header ? <ProgressBar value={progress}></ProgressBar> : <ProgressBarIndeterminate/>}
                {<p className='message-text'>{`${message}`}</p>}
                {header ? <p className='message-text'>{`received ${frames}/${header.frames} frames`}
                </p> : null}
                {header ? <p className='message-text'>{`current video size: ${targetSize} MB`}
                </p> : null}
            </CardContent>  
            <CardActions className="card-actions">
                <div>
                <Button variant="outlined" disabled={!header || downloading} fullWidth={true} onClick={download}>{`${'Download'}`}</Button>
                </div>
                <div>
                <Button variant="outlined" fullWidth={true} onClick={(e) => clickCancel(e)}>{`${'Cancel'}`}</Button>
                </div>
            </CardActions>
        </Card>   
    );
}