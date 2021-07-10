import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState} from "react"
import "./Components/MuteButton"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"
import alanBtn from "@alan-ai/alan-sdk-web";
let socket = io(' https://lets-link-app.herokuapp.com/',{transports: ['websocket', 'polling', 'flashsocket']})


function App() {
    const [ me, setMe ] = useState("")
    const [ stream, setStream ] = useState()
    const [ receivingCall, setReceivingCall ] = useState(false)
    const [ caller, setCaller ] = useState("")
    const [ callerSignal, setCallerSignal ] = useState()
    const [ callAccepted, setCallAccepted ] = useState(false)
    const [ idToCall, setIdToCall ] = useState("")
    const [ callEnded, setCallEnded] = useState(false)
    const [ name, setName ] = useState("")
    const [mic, setMic]= useState(true)
    const [vid, setVid]= useState(true)
    const myVideo = useRef()
    const userVideo = useRef()
    const connectionRef= useRef()
    
    
    useEffect(() => {
        alanBtn({
            key: '1ba6e8977436a17368d366d5a6fa9f702e956eca572e1d8b807a3e2338fdd0dc/stage',
            onCommand: (commandData) => {
                if (commandData.command === 'go:back') {
                        // Call the client code that will react to the received command
                    }
                }
        });
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream)
                myVideo.current.srcObject = stream
        })
    
    socket.on("me", (id) => {
            setMe(id)
        })
 
        socket.on("callUser", (data) => {
            setReceivingCall(true)
            setCaller(data.from)
            setName(data.name)
            setCallerSignal(data.signal)
        })
    }, [])
 
    const callUser = (id) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        })
        peer.on("signal", (data) => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: me,
                name: name
            })
        })
        peer.on("stream", (stream) => {
            
                userVideo.current.srcObject = stream
            
        })
        socket.on("callAccepted", (signal) => {
            setCallAccepted(true)
            peer.signal(signal)
        })
 
        connectionRef.current = peer
    }
 
    const answerCall =() =>  {
        setCallAccepted(true)
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        })
        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: caller })
        })
        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream
        })
 
        peer.signal(callerSignal)
        connectionRef.current = peer
    }
 
    const leaveCall = () => {
        setCallEnded(true)
        connectionRef.current.destroy()
    }
    const handleMic =()=>{
        setMic(!mic);
        const enabled=stream.getAudioTracks()[0].enabled;
        if(enabled)
        stream.getAudioTracks()[0].enabled=false;
        else 
        stream.getAudioTracks()[0].enabled= true;
        console.log(stream.getAudioTracks()[0]);
      }
      const handleVideo =()=>{
        setVid(!vid);
        const enabled=stream.getVideoTracks()[0].enabled;
        if(enabled)
        stream.getVideoTracks()[0].enabled=false;
        else 
        stream.getVideoTracks()[0].enabled= true;
        console.log(stream.getVideoTracks()[0]);
      }
    return (
        <>
            <h1 style={{ textAlign: "center", color: '#865858', fontSize:'3rem' }}>Let's Link</h1>
        <div className="container" >
            <div className="video-container">
                <div className="video">
                    {stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
                    <div className="menu">
                        <div className="menu-icon" onClick={handleMic}>
                            <FontAwesomeIcon  icon={mic ? "microphone" :  "microphone-slash" } size="2x"/>
                        </div> 
                        <div className="menu-icon" onClick={handleVideo}>
                            <FontAwesomeIcon  icon={vid ? "video" :  "video-slash" } size="2x"/>
                        </div>
                    </div>
                </div>
                <div className="video" >
                    {callAccepted && !callEnded ?
                    <video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
                    null}
                </div>
            </div>
            <div className="myId">
                <TextField
                    id="filled-basic"
                    label="Name"
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ marginBottom: "20px" }}
                />
                <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
                    <Button variant="contained" color="inherit" startIcon={<AssignmentIcon fontSize="large" />}>
                        Copy ID
                    </Button>
                </CopyToClipboard>
 
                <TextField
                    id="filled-basic"
                    label="ID to call"
                    variant="outlined"
                    value={idToCall}
                    onChange={(e) => setIdToCall(e.target.value)}
                />
                <div className="call-button">
                    {callAccepted && !callEnded ? (
                        <Button variant="contained" color="secondary" onClick={leaveCall}>
                            End Call
                        </Button>
                    ) : (
                        <IconButton color="inherit" aria-label="call" onClick={() => callUser(idToCall)}>
                            Call<PhoneIcon fontSize="large" />
                        </IconButton>
                    )}
                    {idToCall}
                </div>
            </div>
            <div>
                {receivingCall && !callAccepted ? (
                        <div className="caller">
                        <h1 style={{color:'#865858'}}>Accept the call</h1>
                        <Button variant="contained" color="inherit" onClick={answerCall}>
                            Answer
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
        </>
    )
}
 
export default App
